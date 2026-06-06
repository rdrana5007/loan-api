import { Customer } from "../customer";
import { User } from "../user";
import Loan from "./loan.model";

// Customer associations
Customer.hasMany(Loan, { foreignKey: 'customerId', as: 'loans' });
Loan.belongsTo(Customer, { foreignKey: 'customerId', as: 'customers' });

// User(Manager, Collector) associations
User.hasMany(Loan, { foreignKey: 'collectorId', as: 'loans' });
Loan.belongsTo(User, { foreignKey: 'collectorId', as: 'collectors' });
Loan.belongsTo(User, { foreignKey: 'createdBy', as: 'created_by' });
Loan.belongsTo(User, { foreignKey: 'updatedBy', as: 'updated_by' });
Loan.belongsTo(User, { foreignKey: 'approvedBy', as: 'approved_by' });
Loan.belongsTo(User, { foreignKey: 'rejectedBy', as: 'rejected_by' });
Loan.belongsTo(User, { foreignKey: 'closedBy', as: 'closed_by' });

export { Loan };