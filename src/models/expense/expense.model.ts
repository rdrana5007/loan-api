import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../config";

interface ExpenseAttributes {
    id: number;
    category: string; // Expense type. like - SALARY, RENT, PETROL, MARKETING, OFFICE_SUPPLIES, OTHER
    description: string;
    amount: number;
};

interface ExpenseCreationAttributes extends Optional<ExpenseAttributes, 'id'> {};

class Expense extends Model<ExpenseAttributes, ExpenseCreationAttributes> {
    declare id: number;
    declare category: string;
    declare description: string;
    declare amount: number;
};

Expense.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
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
        }
    },
    {
        sequelize,
        modelName: 'Expense',
        tableName: 'expenses',
        timestamps: true,
        underscored: true,
        paranoid: true
    }
);

export default Expense;