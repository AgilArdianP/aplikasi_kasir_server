'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      transactionCode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      transactionDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      discountAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00
      },
      finalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      paymentMethod: {
        type: Sequelize.ENUM('Cash', 'Card', 'Transfer', 'QRIS', 'Other'),
        allowNull: false,
        defaultValue: 'Cash'
      },
      paymentStatus: {
        type: Sequelize.ENUM('Pending', 'Paid', 'Refunded', 'Cancelled'),
        allowNull: false,
        defaultValue: 'Pending'
      },
      cashierId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users', // Pastikan nama tabel Users sudah benar
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Transactions');
  }
};