import { User } from "../../user";
import Customer from "./customer.model";

// User associations
User.hasMany(Customer, { foreignKey: 'createdBy', as: 'customers' });
Customer.belongsTo(User, { foreignKey: 'createdBy', as: 'created_by' });

export { Customer };