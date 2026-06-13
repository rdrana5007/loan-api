import { User } from "../../user";
import ExpenseRequest from "./expenseRequest.model";

// User (Admin, Manager, Collector) associations
User.hasMany(ExpenseRequest, { foreignKey: 'createdBy', as: 'expense_requests' });
ExpenseRequest.belongsTo(User, { foreignKey: 'createdBy', as: 'created_by' });
ExpenseRequest.belongsTo(User, { foreignKey: 'updatedBy', as: 'updated_by' });

export { ExpenseRequest };