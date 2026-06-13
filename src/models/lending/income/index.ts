import { User } from "../../user";
import Income from "./income.model";

// User (Admin, Manager, Collector) associations
User.hasMany(Income, { foreignKey: 'createdBy', as: 'incomes' });
Income.belongsTo(User, { foreignKey: 'createdBy', as: 'created_by' });

export { Income };