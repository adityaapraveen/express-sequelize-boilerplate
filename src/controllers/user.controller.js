import * as Yup from "yup";
import User from "../models/User";

let userController = {
  add: async (req, res, next) => {
    try {
      const schema = Yup.object().shape({
        name: Yup.string().required("Name is required"),
        email: Yup.string()
          .email("Email must be valid")
          .required("Email is required"),
        password: Yup.string()
          .required("Password is required")
          .min(6, "Password must be at least 6 characters"),
        default_currency: Yup.string()
          .length(3, "Currency mustbe INR, USD, EUR")
          .default("INR"),
      });

      try {
        await schema.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
        });
      } catch (error) {
        return res.status(400).json({
          message: "req body validation failed",
          errors: error.errors,
        });
      }

      const { name, email, password, default_currency = "INR" } = req.body;

      const userExists = await User.findOne({
        where: { email },
      });

      if (userExists) {
        return res.status(409).json({
          message: "User with this email already exists",
        });
      }

      const user = await User.create({
        name,
        email,
        password,
        default_currency: default_currency.toUpperCase(),
      });

      return res.status(201).json({
        message: "User created successfully",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          default_currency: user.default_currency,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  },
  get: async (req, res, next) => {
    try {
      const users = await User.findAll({
        attributes: [
          "id",
          "name",
          "email",
          "default_currency",
          "created_at",
          "updated_at",
        ],
        order: [["created_at", "DESC"]],
      });

      return res.status(200).json({
        data: users,
      });
    } catch (error) {
      next(error);
    }
  },
  find: async (req, res, next) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: [
          "id",
          "name",
          "email",
          "default_currency",
          "created_at",
          "updated_at",
        ],
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      return res.status(200).json({
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const schema = Yup.object().shape({
        name: Yup.string(),
        email: Yup.string().email("Email must be valid"),
        default_currency: Yup.string().length(
          3,
          "Currency must be INR, USD, EUR"
        ),
      });

      try {
        await schema.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
        });
      } catch (error) {
        return res.status(400).json({
          message: "reqbody Validation failed",
          errors: error.errors,
        });
      }

      const { id } = req.params;
      const { name, email, default_currency } = req.body;

      if (!name && !email && !default_currency) {
        return res.status(400).json({
          message:
            "one field is required: name, email, or default_currency",
        });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (email && email !== user.email) {
        const userExists = await User.findOne({
          where: { email },
        });

        if (userExists) {
          return res.status(409).json({
            message: "Email is already in use",
          });
        }
      }

      await user.update({
        name: name || user.name,
        email: email || user.email,
        default_currency: default_currency
          ? default_currency.toUpperCase()
          : user.default_currency,
      });

      return res.status(200).json({
        message: "User profile updated successfully",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          default_currency: user.default_currency,
          updated_at: user.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      await user.destroy();

      return res.status(200).json({
        message: "User deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
}

export default userController;
