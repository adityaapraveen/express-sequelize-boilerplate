import Sequelize, { Model } from "sequelize";

class Balance extends Model {
    static init(sequelize) {
        super.init(
            {
                user_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },

                counterparty_user_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },

                currency: {
                    type: Sequelize.STRING(3),
                    allowNull: false,
                },

                amount: {
                    type: Sequelize.DECIMAL(12, 2),
                    allowNull: false,
                    defaultValue: 0,
                },
            },
            {
                sequelize,
                modelName: "Balance",
                tableName: "balances",
                underscored: true,
                timestamps: true,
            }
        );

        return this;
    }

    static associate(models) {
        if (models.User) {
            this.belongsTo(models.User, {
                foreignKey: "user_id",
                as: "user",
            });

            this.belongsTo(models.User, {
                foreignKey: "counterparty_user_id",
                as: "counterparty",
            });
        }
    }
}

export default Balance;