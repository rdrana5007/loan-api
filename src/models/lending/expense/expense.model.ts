import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config";

interface ExpenseAttributes {
    id: number;
    createdBy: number;
    category: string; // Expense type. like - SALARY, RENT, PETROL, MARKETING, OFFICE_SUPPLIES, OTHER
    description: string;
    amount: number;
    createdAt?: Date | null;
};

interface ExpenseCreationAttributes extends Optional<ExpenseAttributes, 'id' | 'createdAt'> {};

class Expense extends Model<ExpenseAttributes, ExpenseCreationAttributes> {
    declare id: number;
    declare createdBy: number;
    declare category: string;
    declare description: string;
    declare amount: number;
    declare readonly createdAt?: Date | null;
};

Expense.init(
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



// | Category        | Description                                           |
// | --------------- | ----------------------------------------------------- |
// | SALARY          | Staff salaries, allowances, bonuses                   |
// | RENT            | Office rent, branch rent                              |
// | PETROL          | Vehicle fuel, transportation expenses                 |
// | MARKETING       | Ads, promotions, events                               |
// | OFFICE_SUPPLIES | Stationery, consumables                               |
// | UTILITIES       | Electricity, water, internet, phone                   |
// | TRAINING        | Staff training & development                          |
// | LOAN_RECOVERY   | Losses on loans or write-offs (if tracked as expense) |
// | OTHER           | Miscellaneous                                         |


// | Action          | Admin | Manager    | Collector   |
// | --------------- | ----- | ---------- | ----------- |
// | View Expenses   | ✅     | ✅          | Limited/Own |
// | Create Expense  | ✅     | ✅          | ❌           |
// | Update Expense  | ✅     | Own/Recent | ❌           |
// | Delete Expense  | ✅     | ❌          | ❌           |
// | Expense Reports | ✅     | ✅          | ❌           |
