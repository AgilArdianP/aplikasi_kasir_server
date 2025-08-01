const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const StockOpname = sequelize.define('StockOpname', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Stock opname name cannot be empty.' }
            }
        },
        scheduledStartTime: {
            type: DataTypes.DATE,
            allowNull: false
        },
        scheduledEndTime: {
            type: DataTypes.DATE,
            allowNull: false
        },
        actualStartTime: {
            type: DataTypes.DATE,
            allowNull: true // Diisi saat SO dimulai
        },
        actualEndTime: {
            type: DataTypes.DATE,
            allowNull: true // Diisi saat SO selesai
        },
        status: {
            type: DataTypes.ENUM('Scheduled', 'In Progress', 'Completed', 'Canceled'),
            allowNull: false,
            defaultValue: 'Scheduled'
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Users', // Mengacu ke tabel Users
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT' // Jangan hapus user jika ada SO terkait
        },
        performedBy: {
            type: DataTypes.UUID,
            allowNull: true, // Bisa null jika belum dimulai/diselesaikan
            references: {
                model: 'Users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'StockOpnames',
        timestamps: true
    });

    StockOpname.associate = (models) => {
        StockOpname.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
        StockOpname.belongsTo(models.User, { foreignKey: 'performedBy', as: 'performer' });
        StockOpname.hasMany(models.StockOpnameItem, { foreignKey: 'stockOpnameId', as: 'items' });
    };

    return StockOpname;
};