import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config";

interface ExpenseRequestAttributes {
    id: number;
    createdBy: number;
    updatedBy?: number | null;
    category: string; // ExpenseRequest type. like - SALARY, RENT, PETROL, MARKETING, OFFICE_SUPPLIES, OTHER
    description: string;
    amount: number;
    status: string;
};

interface ExpenseRequestCreationAttributes extends Optional<ExpenseRequestAttributes, 'id' | 'updatedBy' | 'status'> {};

class ExpenseRequest extends Model<ExpenseRequestAttributes, ExpenseRequestCreationAttributes> {
    declare id: number;
    declare createdBy: number;
    declare updatedBy?: number | null;
    declare category: string;
    declare description: string;
    declare amount: number;
    declare status: string;
};

ExpenseRequest.init(
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
        updatedBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'users', key: 'id' }
        },
        category: {
            type: new DataTypes.STRING(128),
            allowNull: false
        },
        description: {
            type: new DataTypes.TEXT,
            allowNull: false
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending'
        }
    },
    {
        sequelize,
        modelName: 'ExpenseRequest',
        tableName: 'expense_requests',
        timestamps: true,
        underscored: true,
        paranoid: true
    }
);

export default ExpenseRequest;