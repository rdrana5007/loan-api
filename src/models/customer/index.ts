import { Role } from "../role";
import { User } from "../user";
import Customer from "./customer.model";

// Role associations
Role.hasMany(Customer, { foreignKey: 'roleId', as: 'customers' });
Customer.belongsTo(Role, { foreignKey: 'roleId', as: 'roles' });

// User associations
User.hasMany(Customer, { foreignKey: 'createdBy', as: 'customers' });
Customer.belongsTo(User, { foreignKey: 'createdBy', as: 'created_by' });

export { Customer };