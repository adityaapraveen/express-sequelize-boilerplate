'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable("expense_activities", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      expense_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "expenses",
          key: "id",
        },
        onDelete: "SET NULL",
      },

      actor_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
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

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable("expense_activities");

  }
};
