import Sequelize, { Model } from "sequelize";

class ExpenseMember extends Model {
  static init(sequelize) {
    super.init(
      {
        expense_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },

        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },

        share_amount: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },

        paid_amount: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        modelName: "ExpenseMember",
        tableName: "expense_members",
        underscored: true,
        timestamps: true,
      }
    );

    return this;
  }

  static associate(models) {
    if (models.Expense) {
      this.belongsTo(models.Expense, {
        foreignKey: "expense_id",
        as: "expense",
      });
    }

    if (models.User) {
      this.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }
}

export default ExpenseMember;