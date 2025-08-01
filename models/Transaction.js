// models/Transaction.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Transaction = sequelize.define('Transaction', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        transactionCode: { // Kode unik untuk transaksi (misal: INV-20250724-0001)
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        transactionDate: { // Tanggal dan waktu transaksi
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        totalAmount: { // Total harga sebelum diskon/pajak (sum dari TransactionItems)
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        discountAmount: { // Jumlah diskon yang diberikan (jika ada)
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
        },
        finalAmount: { // Total harga akhir setelah diskon
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        paymentMethod: { // Metode pembayaran (Cash, Card, Transfer, etc.)
            type: DataTypes.ENUM('Cash', 'Card', 'Transfer', 'QRIS', 'Other'),
            allowNull: false,
            defaultValue: 'Cash'
        },
        paymentStatus: { // Status pembayaran (Pending, Paid, Refunded, Cancelled)
            type: DataTypes.ENUM('Pending', 'Paid', 'Refunded', 'Cancelled'),
            allowNull: false,
            defaultValue: 'Pending'
        },
        cashierId: { // ID pengguna (kasir) yang melayani transaksi
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Users', // Merujuk ke tabel Users
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT' // Jangan hapus user jika masih ada transaksi
        },
        // Anda bisa menambahkan kolom lain seperti:
        // customerId: { // Jika ada model Customer
        //     type: DataTypes.UUID,
        //     allowNull: true,
        //     references: {
        //         model: 'Customers',
        //         key: 'id'
        //     },
        //     onUpdate: 'CASCADE',
        //     onDelete: 'SET NULL'
        // }
    }, {
        tableName: 'Transactions',
        timestamps: true
    });

    Transaction.associate = (models) => {
        Transaction.belongsTo(models.User, { foreignKey: 'cashierId', as: 'cashier' });
        Transaction.hasMany(models.TransactionItem, { foreignKey: 'transactionId', as: 'items' });
    };

    return Transaction;
};