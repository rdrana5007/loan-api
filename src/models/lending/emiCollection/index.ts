import { User } from "../../user";
import { Customer } from "../customer";
import { Loan } from "../loan";
import EmiCollection from "./emiCollection.model";

// Loan associations
Loan.hasMany(EmiCollection, { foreignKey: 'loanId', as: 'emi_collections' });
EmiCollection.belongsTo(Loan, { foreignKey: 'loanId', as: 'loans' });

// Customer associations
Customer.hasMany(EmiCollection, { foreignKey: 'customerId', as: 'emi_collections' });
EmiCollection.belongsTo(Customer, { foreignKey: 'customerId', as: 'customers' });

// User (Collector) associations
User.hasMany(EmiCollection, { foreignKey: 'collectorId', as: 'emi_collections' });
EmiCollection.belongsTo(User, { foreignKey: 'collectorId', as: 'created_by' });

export { EmiCollection };