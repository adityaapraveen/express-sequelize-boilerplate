import * as Yup from "yup";
import { Op } from "sequelize";

import User from "../models/User";
import Expense from "../models/Expense";
import ExpenseMember from "../models/ExpenseMember";

let expenseController = {
    add: async (req, res, next) => {
        const transaction = await Expense.sequelize.transaction();

        try {
            const schema = Yup.object().shape({
                name: Yup.string().required("Name is required"),
                value: Yup.number().positive().required("Value is required"),
                currency: Yup.string().length(3).required("Currency is required"),
                date: Yup.date().required("Date is required"),
                paid_by_user_id: Yup.number().required("Payer is required"),
                created_by_user_id: Yup.number().required("Creator is required"),
                members: Yup.array()
                    .of(Yup.number())
                    .min(1, "At least 1 members are required")
                    .required("Members are required"),
            });

            try {
                await schema.validate(req.body, { abortEarly: false });
            } catch (error) {
                await transaction.rollback();

                return res.status(400).json({
                    message: "reqbody Validation failed",
                    errors: error.errors,
                });
            }

            const {
                name,
                value,
                currency,
                date,
                paid_by_user_id,
                created_by_user_id,
                members,
            } = req.body;

            const uniqueMembers = [...new Set(members)];

            if (!uniqueMembers.includes(paid_by_user_id)) {
                await transaction.rollback();

                return res.status(400).json({
                    message: "Payer must be included in members",   // for now payer has to be included in members
                });
            }

            const users = await User.findAll({
                where: {
                    id: {
                        [Op.in]: [...uniqueMembers, created_by_user_id],
                    },
                },
                transaction,
            });

            const requiredUserIds = [...new Set([...uniqueMembers, created_by_user_id])];

            if (users.length !== requiredUserIds.length) {
                await transaction.rollback();

                return res.status(404).json({
                    message: "One or more users do not exist",
                });
            }

            const expense = await Expense.create(
                {
                    name,
                    value,
                    currency: currency.toUpperCase(),
                    date,
                    paid_by_user_id,
                    created_by_user_id,
                    split_type: "EQUAL",
                },
                { transaction }
            );

            const shareAmount = Number(value) / uniqueMembers.length;

            for (const memberId of uniqueMembers) {
                await ExpenseMember.create(
                    {
                        expense_id: expense.id,
                        user_id: memberId,
                        share_amount: shareAmount,
                        paid_amount: memberId === paid_by_user_id ? value : 0,
                    },
                    { transaction }
                );
            }

            await transaction.commit();

            return res.status(201).json({
                message: "Expense created successfully",
                data: expense,
            });
        } catch (error) {
            await transaction.rollback();
            next(error);
        }
    },

    get: async (req, res, next) => {
        try {
            const schema = Yup.object().shape({
                user_id: Yup.number().required("user_id is required"),
            });

            try {
                await schema.validate(req.query, { abortEarly: false });
            } catch (error) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: error.errors,
                });
            }

            const { user_id } = req.query;

            const expenseMembers = await ExpenseMember.findAll({
                where: { user_id },
            });

            const expenseIds = expenseMembers.map((item) => item.expense_id);

            const expenses = await Expense.findAll({
                where: {
                    id: {
                        [Op.in]: expenseIds,
                    },
                },
                include: [
                    {
                        model: ExpenseMember,
                        as: "members",
                        include: [
                            {
                                model: User,
                                as: "user",
                                attributes: ["id", "name", "email"],
                            },
                        ],
                    },
                    {
                        model: User,
                        as: "payer",
                        attributes: ["id", "name", "email"],
                    },
                ],
                order: [["date", "DESC"]],
            });

            return res.status(200).json({
                data: expenses,
            });
        } catch (error) {
            next(error);
        }
    },

    find: async (req, res, next) => {
        try {
            const { id } = req.params;

            const expense = await Expense.findByPk(id, {
                include: [
                    {
                        model: ExpenseMember,
                        as: "members",
                        include: [
                            {
                                model: User,
                                as: "user",
                                attributes: ["id", "name", "email"],
                            },
                        ],
                    },
                    {
                        model: User,
                        as: "payer",
                        attributes: ["id", "name", "email"],
                    },
                ],
            });

            if (!expense) {
                return res.status(404).json({
                    message: "Expense not found",
                });
            }

            return res.status(200).json({
                data: expense,
            });
        } catch (error) {
            next(error);
        }
    },

    update: async (req, res, next) => {
        const transaction = await Expense.sequelize.transaction();

        try {
            const schema = Yup.object().shape({
                name: Yup.string(),
                value: Yup.number().positive(),
                currency: Yup.string().length(3),
                date: Yup.date(),
                paid_by_user_id: Yup.number(),
                members: Yup.array().of(Yup.number()).min(1),
            });

            try {
                await schema.validate(req.body, { abortEarly: false });
            } catch (error) {
                await transaction.rollback();

                return res.status(400).json({
                    message: "reqbody Validation failed",
                    errors: error.errors,
                });
            }

            const { id } = req.params;

            const expense = await Expense.findByPk(id, {
                include: [{ model: ExpenseMember, as: "members" }],
                transaction,
            });

            if (!expense) {
                await transaction.rollback();

                return res.status(404).json({
                    message: "Expense not found",
                });
            }

            const newMembers = req.body.members || expense.members.map((m) => m.user_id);
            const newPaidByUserId = req.body.paid_by_user_id || expense.paid_by_user_id;
            const newValue = req.body.value || expense.value;

            if (!newMembers.includes(newPaidByUserId)) {
                await transaction.rollback();

                return res.status(400).json({
                    message: "Payer must be included in members",
                });
            }

            await expense.update(
                {
                    name: req.body.name || expense.name,
                    value: newValue,
                    currency: req.body.currency
                        ? req.body.currency.toUpperCase()
                        : expense.currency,
                    date: req.body.date || expense.date,
                    paid_by_user_id: newPaidByUserId,

                },
                { transaction }
            );

            await ExpenseMember.destroy({
                where: { expense_id: expense.id },
                transaction,
            });

            const shareAmount = Number(newValue) / newMembers.length;

            for (const memberId of newMembers) {
                await ExpenseMember.create(
                    {
                        expense_id: expense.id,
                        user_id: memberId,
                        share_amount: shareAmount,
                        paid_amount: memberId === newPaidByUserId ? newValue : 0,
                    },
                    { transaction }
                );
            }

            await transaction.commit();

            return res.status(200).json({
                message: "Expense updated successfully",
            });
        } catch (error) {
            await transaction.rollback();
            next(error);
        }
    },

    delete: async (req, res, next) => {
        const transaction = await Expense.sequelize.transaction();

        try {
            const { id } = req.params;

            const expense = await Expense.findByPk(id, { transaction });

            if (!expense) {
                await transaction.rollback();

                return res.status(404).json({
                    message: "Expense not found",
                });
            }

            await ExpenseMember.destroy({
                where: { expense_id: expense.id },
                transaction,
            });

            await expense.destroy({ transaction });

            await transaction.commit();

            return res.status(200).json({
                message: "Expense deleted successfully",
            });
        } catch (error) {
            await transaction.rollback();
            next(error);
        }
    },
};

export default expenseController;