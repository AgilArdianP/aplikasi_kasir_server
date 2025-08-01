const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notNull: { msg: 'Username cannot be empty.' },
                notEmpty: { msg: 'Username cannot be empty.' }
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true, 
            unique: true,
            validate: {
                isEmail: { msg: 'Must be a valid email address.' }
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: { msg: 'Password cannot be empty.' },
                notEmpty: { msg: 'Password cannot be empty.' },
                len: {
                    args: [6, 255],
                    msg: 'Password must be at least 6 characters long.'
                }
            }
        },
        role: {
            type: DataTypes.ENUM('admin', 'cashier'), 
            allowNull: false,
            defaultValue: 'cashier',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        profilePicture: {
            type: DataTypes.STRING,
            allowNull: true
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'Users',
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
                    user.password = await bcrypt.hash(user.password, saltRounds);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
                    user.password = await bcrypt.hash(user.password, saltRounds);
                }
            }
        }
    });

    User.prototype.comparePassword = async function (candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
    };

    User.associate = (models) => {
        // User.hasMany(models.Transaction, { foreignKey: 'userId', as: 'transactions' });
    };

    return User;
};