// models/TransactionItem.js (DIMODIFIKASI)
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TransactionItem = sequelize.define('TransactionItem', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        transactionId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Transactions',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        productId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Products',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT' // Jangan hapus item jika produk dihapus
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1
            }
        },
        pricePerUnit: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            }
        },
        priceType: { // 'retail' atau 'wholesale'
            type: DataTypes.ENUM('retail', 'wholesale'),
            allowNull: false
        },
        subtotal: { // pricePerUnit * quantity
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            }
        },
        discountApplied: { // <-- TAMBAHKAN KOLOM INI
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
            validate: {
                min: 0
            }
        },
        // ... kolom lainnya (createdAt, updatedAt)
    }, {
        tableName: 'TransactionItems',
        timestamps: true
    });

    TransactionItem.associate = (models) => {
        TransactionItem.belongsTo(models.Transaction, { foreignKey: 'transactionId', as: 'transaction' });
        TransactionItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    };

    return TransactionItem;
};