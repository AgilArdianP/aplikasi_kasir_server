// models/Product.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Product = sequelize.define('Product', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: { msg: 'Product name cannot be empty.' }
            }
        },
        barcode: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        // --- OPSI HARGA BARU ---
        modalPrice: { // Harga Modal
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                isDecimal: { msg: 'Modal price must be a valid decimal number.' },
                min: { args: [0], msg: 'Modal price cannot be negative.' }
            }
        },
        retailPrice: { // Harga Jual Retail
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                isDecimal: { msg: 'Retail price must be a valid decimal number.' },
                min: { args: [0], msg: 'Retail price cannot be negative.' }
            }
        },
        wholesalePrice: { // Harga Jual Grosir
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true, // Bisa jadi tidak semua produk punya harga grosir
            validate: {
                isDecimal: { msg: 'Wholesale price must be a valid decimal number.' },
                min: { args: [0], msg: 'Wholesale price cannot be negative.' }
            }
        },
        // --- AKHIR OPSI HARGA BARU ---
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                isInt: { msg: 'Stock must be an integer.' },
                min: { args: [0], msg: 'Stock cannot be negative.' }
            }
        },
        imageUrl: { // Untuk menyimpan path gambar yang diunggah
            type: DataTypes.STRING,
            allowNull: true,
        },
        unit: { // Satuan dasar produk (misal: "Kg", "Pcs", "Liter")
            type: DataTypes.STRING,
            allowNull: true, // Bisa jadi tidak semua produk punya satuan spesifik yang ingin dikonversi
            validate: {
                notEmpty: { msg: 'Unit cannot be empty.' }
            }
        },
        categoryId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'Categories',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        }
        
    }, {
        tableName: 'Products',
        timestamps: true
    });

    Product.associate = (models) => {
        Product.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
        Product.belongsToMany(models.Discount, {
            through: 'DiscountProducts',
            foreignKey: 'productId',
            otherKey: 'discountId',
            as: 'appliedDiscounts'
        });
    };

    return Product;
};