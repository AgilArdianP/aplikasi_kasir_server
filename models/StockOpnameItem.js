const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const StockOpnameItem = sequelize.define('StockOpnameItem', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        stockOpnameId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'StockOpnames', // Mengacu ke tabel StockOpnames
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE' // Jika SO dihapus, itemnya juga dihapus
        },
        productId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Products', // Mengacu ke tabel Products
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT' // Jangan hapus produk jika ada di SOItem
        },
        systemStockSnapshot: { // Stok di sistem saat SO dimulai
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        physicalCount: { // Jumlah hitung fisik yang dimasukkan
            type: DataTypes.INTEGER,
            allowNull: true // Awalnya bisa null atau 0
        },
        variance: { // Selisih = physicalCount - systemStockSnapshot
            type: DataTypes.INTEGER,
            allowNull: true
        },
        varianceValue: { // Nilai moneter selisih = variance * modalPrice
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'StockOpnameItems',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['stockOpnameId', 'productId'], // Memastikan satu produk hanya ada satu kali per SO
                name: 'unique_stock_opname_item'
            }
        ]
    });

    StockOpnameItem.associate = (models) => {
        StockOpnameItem.belongsTo(models.StockOpname, { foreignKey: 'stockOpnameId', as: 'stockOpname' });
        StockOpnameItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    };

    return StockOpnameItem;
};