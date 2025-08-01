// models/Category.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Category = sequelize.define('Category', {
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
                notEmpty: { msg: 'Category name cannot be empty.' }
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'Categories',
        timestamps: true
    });

    Category.associate = (models) => {
        Category.hasMany(models.Product, { foreignKey: 'categoryId', as: 'products' });
    };

    return Category;
};