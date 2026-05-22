import * as Yup from "yup";

import User from "../models/User";
import Expense from "../models/Expense";
import ExpenseMember from "../models/ExpenseMember";

let balanceController = {
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

            const user = await User.findByPk(user_id);

            if (!user) {
                return res.status(404).json({
                    message: "User not found",
                });
            }

            const userExpenseMembers = await ExpenseMember.findAll({
                where: { user_id },
            });

            const expenseIds = userExpenseMembers.map((item) => item.expense_id);

            const expenses = await Expense.findAll({
                where: {
                    id: expenseIds,
                },
                include: [
                    {
                        model: ExpenseMember,
                        as: "members",
                    },
                ],
            });

            const balances = {};

            for (const expense of expenses) {
                const payerId = expense.paid_by_user_id;
                const currency = expense.currency;

                const currentUserMember = expense.members.find((member) => {
                    return Number(member.user_id) === Number(user_id);
                });

                if (!currentUserMember) {
                    continue;
                }

                if (Number(payerId) === Number(user_id)) {
                    for (const member of expense.members) {
                        if (Number(member.user_id) === Number(user_id)) {
                            continue;
                        }

                        const key = `${member.user_id}-${currency}`;

                        if (!balances[key]) {
                            balances[key] = {
                                user_id: member.user_id,
                                currency,
                                amount: 0,
                            };
                        }

                        balances[key].amount =
                            Number(balances[key].amount) + Number(member.share_amount);
                    }
                } else {
                    const key = `${payerId}-${currency}`;

                    if (!balances[key]) {
                        balances[key] = {
                            user_id: payerId,
                            currency,
                            amount: 0,
                        };
                    }

                    balances[key].amount =
                        Number(balances[key].amount) -
                        Number(currentUserMember.share_amount);
                }
            }

            const balanceList = Object.values(balances);

            const userIds = balanceList.map((balance) => balance.user_id);

            const users = await User.findAll({
                where: {
                    id: userIds,
                },
                attributes: ["id", "name", "email"],
            });

            const result = balanceList.map((balance) => {
                const counterparty = users.find((item) => {
                    return Number(item.id) === Number(balance.user_id);
                });

                return {
                    user: counterparty,
                    currency: balance.currency,
                    amount: Number(balance.amount),
                    type: Number(balance.amount) >= 0 ? "GETS_BACK" : "OWES",
                };
            });

            return res.status(200).json({
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },
};

export default balanceController;