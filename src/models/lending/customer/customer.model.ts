import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config";

interface CustomerAttributes {
    id: number;
    createdBy: number;
    customerCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    profileImage?: string | null;
    isActive: boolean;
    createdAt?: Date | null;
};

interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'profileImage' | 'isActive'> {};

class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> {
    declare id: number;
    declare createdBy: number;
    declare customerCode: string;
    declare firstName: string;
    declare lastName: string;
    declare email: string;
    declare phone: string;
    declare gender: string;
    declare address: string;
    declare city: string;
    declare state: string;
    declare pincode: string;
    declare profileImage?: string | null;
    declare isActive: boolean;
    declare readonly createdAt?: Date | null;
};

Customer.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        createdBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'users', key: 'id' },
            allowNull: false
        },
        customerCode: {
            type: new DataTypes.STRING(20),
            allowNull: false,
            unique: true
        },
        firstName: {
            type: new DataTypes.STRING(128),
            allowNull: false
        },
        lastName: {
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
        gender: {
            type: new DataTypes.STRING(6),
            allowNull: false
        },
        address: {
            type: new DataTypes.TEXT,
            allowNull: false
        },
        city: {
            type: new DataTypes.STRING(100),
            allowNull: false
        },
        state: {
            type: new DataTypes.STRING(100),
            allowNull: false
        },
        pincode: {
            type: new DataTypes.STRING(20),
            allowNull: false
        },
        profileImage: {
            type: new DataTypes.STRING
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    },
    {
        sequelize,
        modelName: 'Customer',
        tableName: 'customers',
        timestamps: true,
        underscored: true,
        paranoid: true
    }
);

export default Customer;