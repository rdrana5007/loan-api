import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config";

interface IncomeAttributes {
    id: number;
    createdBy: number;
    category: string; // Income type. like - LOAN_INTEREST, PROCESSING_FEE, LATE_PENALTY, OTHER
    source: string; // Where money came from. like - Rahul Loan #LN-2026-0001 (Rahul Loan Payment), Processing Fee, Late Payment Charges
    amount: number;
    remarks?: string;
    createdAt?: Date | null;
};

interface IncomeCreationAttributes extends Optional<IncomeAttributes, 'id' | 'remarks' | 'createdAt'> {};

class Income extends Model<IncomeAttributes, IncomeCreationAttributes> {
    declare id: number;
    declare createdBy: number;
    declare category: string;
    declare source: string;
    declare amount: number;
    declare remarks?: string | null;
    declare readonly createdAt?: Date | null;
};

Income.init(
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
        category: {
            type: new DataTypes.STRING(128),
            allowNull: false
        },
        source: {
            type: new DataTypes.TEXT,
            allowNull: false
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        remarks: {
            type: new DataTypes.TEXT
        }
    },
    {
        sequelize,
        modelName: 'Income',
        tableName: 'incomes',
        timestamps: true,
        underscored: true,
        paranoid: true
    }
);

export default Income;