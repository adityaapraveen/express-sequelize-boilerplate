import Sequelize, { Model } from "sequelize";

class ExpenseActivity extends Model {
  static init(sequelize) {
    super.init(
      {
        expense_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },

        actor_user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },

        action: {
          type: Sequelize.ENUM(
            "EXPENSE_CREATED",
            "EXPENSE_UPDATED",
            "EXPENSE_DELETED",
            "MEMBER_ADDED",
            "MEMBER_REMOVED",
            "BALANCE_UPDATED"
          ),
          allowNull: false,
        },

        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "ExpenseActivity",
        tableName: "expense_activities",
        underscored: true,
        timestamps: true,
        updatedAt: false,
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
        foreignKey: "actor_user_id",
        as: "actor",
      });
    }
  }
}

export default ExpenseActivity;