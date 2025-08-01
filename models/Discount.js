// models/Discount.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Discount = sequelize.define('Discount', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        name: { // Nama diskon (misal: "Diskon Lebaran", "Diskon Produk Terbaru")
            type: DataTypes.STRING,
            allowNull: false
        },
        type: { // Jenis diskon: 'percentage' atau 'fixed_amount'
            type: DataTypes.ENUM('percentage', 'fixed_amount'),
            allowNull: false
        },
        value: { // Nilai diskon (misal: 10 untuk 10%, atau 5000 untuk Rp5000)
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            }
        },
        appliesTo: { // Cakupan diskon: 'all_products' atau 'specific_products'
            type: DataTypes.ENUM('all_products', 'specific_products'),
            allowNull: false
        },
        startDate: { // Tanggal mulai berlaku diskon
            type: DataTypes.DATE,
            allowNull: false
        },
        endDate: { // Tanggal berakhir berlaku diskon
            type: DataTypes.DATE,
            allowNull: false
        },
        isActive: { // Status aktif/non-aktif diskon
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'Discounts',
        timestamps: true
    });

    Discount.associate = (models) => {
        // Hubungan Many-to-Many dengan Product jika appliesTo 'specific_products'
        // Menggunakan tabel pivot (join table) DiscountProducts
        Discount.belongsToMany(models.Product, {
            through: 'DiscountProducts', // Nama tabel pivot
            foreignKey: 'discountId',
            otherKey: 'productId',
            as: 'discountedProducts'
        });
    };

    return Discount;
};