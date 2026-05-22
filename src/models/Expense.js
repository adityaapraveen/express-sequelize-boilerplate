import Sequelize, { Model } from "sequelize";

class Expense extends Model {
    static init(sequelize) {
        super.init(
            {
                name: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },

                value: {
                    type: Sequelize.DECIMAL(12, 2),
                    allowNull: false,
                },

                currency: {
                    type: Sequelize.STRING(3),
                    allowNull: false,
                },

                date: {
                    type: Sequelize.DATEONLY,
                    allowNull: false,
                },

                paid_by_user_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },

                created_by_user_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },

                split_type: {
                    type: Sequelize.ENUM("EQUAL", "EXACT", "PERCENTAGE"),
                    allowNull: false,
                    defaultValue: "EQUAL",
                },

              
            },
            {
                sequelize,
                modelName: "Expense",
                tableName: "expenses",
                underscored: true,
                timestamps: true,
                paranoid: true,
                deletedAt: "deleted_at",
            }
        );

        return this;
    }

    static associate(models) {
        if (models.User) {
            this.belongsTo(models.User, {
                foreignKey: "paid_by_user_id",
                as: "payer",
            });

            this.belongsTo(models.User, {
                foreignKey: "created_by_user_id",
                as: "creator",
            });
        }

        if (models.ExpenseMember) {
            this.hasMany(models.ExpenseMember, {
                foreignKey: "expense_id",
                as: "members",
            });
        }

        if (models.ExpenseActivity) {
            this.hasMany(models.ExpenseActivity, {
                foreignKey: "expense_id",
                as: "activities",
            });
        }
    }
}

export default Expense;