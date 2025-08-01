'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StockOpnameItems', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      stockOpnameId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'StockOpnames',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      productId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      systemStockSnapshot: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      physicalCount: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      variance: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      varianceValue: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
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

    // Menambahkan unique index untuk memastikan satu produk hanya ada satu kali per SO
    await queryInterface.addConstraint('StockOpnameItems', {
      fields: ['stockOpnameId', 'productId'],
      type: 'unique',
      name: 'unique_stock_opname_item'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('StockOpnameItems');
  }
};
