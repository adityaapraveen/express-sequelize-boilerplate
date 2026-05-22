import Sequelize, { Model } from "sequelize";
import bcrypt from "bcryptjs";

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.VIRTUAL,
        password_hash: Sequelize.STRING,
        default_currency: Sequelize.STRING,
      },
      {
        sequelize,
        tableName: "users",
        underscored: true,
        paranoid: true,
        deletedAt: "deleted_at",
      }
    );

    this.addHook("beforeSave", async (user) => {
      if (user.password) {
        user.password_hash = await bcrypt.hash(user.password, 8);
      }
    });

    return this;
  }

  static associate(models) {
    if (models.Expense) {
      this.hasMany(models.Expense, {
        foreignKey: "paid_by_user_id",
        as: "paidExpenses",
      });

      this.hasMany(models.Expense, {
        foreignKey: "created_by_user_id",
        as: "createdExpenses",
      });
    }

    if (models.ExpenseMember) {
      this.hasMany(models.ExpenseMember, {
        foreignKey: "user_id",
        as: "expenseMemberships",
      });
    }

    if (models.Balance) {
      this.hasMany(models.Balance, {
        foreignKey: "user_id",
        as: "balances",
      });

      this.hasMany(models.Balance, {
        foreignKey: "counterparty_user_id",
        as: "counterpartyBalances",
      });
    }

    if (models.ExpenseActivity) {
      this.hasMany(models.ExpenseActivity, {
        foreignKey: "actor_user_id",
        as: "activities",
      });
    }
  }

  checkPassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }
}

export default User;