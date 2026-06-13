import { User } from "../../user";
import Expense from "./expense.model";

// User (Admin, Manager, Collector) associations
User.hasMany(Expense, { foreignKey: 'createdBy', as: 'expenses' });
Expense.belongsTo(User, { foreignKey: 'createdBy', as: 'created_by' });

export { Expense };