import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../config";

interface UserAttributes {
    id: number;
    roleId?: number | null;
    userName: string;
    fullName: string;
    email: string;
    phone: string;
    password: string;
    signInProvider?: string | null;
    isActive: boolean;
};

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'roleId' | 'signInProvider' | 'isActive'> {};

class User extends Model<UserAttributes, UserCreationAttributes> {
    declare id: number;
    declare roleId?: number | null;
    declare userName: string;
    declare fullName: string;
    declare email: string;
    declare phone: string;
    declare password: string;
    declare signInProvider?: string | null;
    declare isActive: boolean;
};

User.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        roleId: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'roles', key: 'id' }
        },
        userName: {
            type: new DataTypes.STRING(128),
            allowNull: false
        },
        fullName: {
            type: new DataTypes.STRING(128),
            allowNull: false
        },
        email: {
            type: new DataTypes.STRING(128),
            allowNull: false,
            unique: true,
            validate: { isEmail: true }
        },
        phone: {
            type: new DataTypes.STRING(15),
            allowNull: false
        },
        password: {
            type: new DataTypes.STRING(128),
            allowNull: false
        },
        signInProvider: {
            type: DataTypes.STRING(128)
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        underscored: true,
        paranoid: true
    }
);

export default User;