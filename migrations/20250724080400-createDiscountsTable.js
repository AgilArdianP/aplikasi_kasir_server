'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Discounts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('percentage', 'fixed_amount'),
        allowNull: false
      },
      value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      appliesTo: {
        type: Sequelize.ENUM('all_products', 'specific_products'),
        allowNull: false
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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

    // Tabel pivot untuk Many-to-Many antara Discounts dan Products
    await queryInterface.createTable('DiscountProducts', {
      discountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Discounts',
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
        onDelete: 'CASCADE'
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

    // Tambahkan primary key gabungan untuk tabel pivot
    await queryInterface.addConstraint('DiscountProducts', {
      fields: ['discountId', 'productId'],
      type: 'primary key',
      name: 'discount_products_pk'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('DiscountProducts');
    await queryInterface.dropTable('Discounts');
  }
};