import { User } from "../../user";
import { Customer } from "../customer";
import { EmiSchedule } from "../emiSchedule";
import EmiCollection from "./emiCollection.model";

// EmiSchedule associations
EmiSchedule.hasMany(EmiCollection, { foreignKey: 'loanId', as: 'emi_collections' });
EmiCollection.belongsTo(EmiSchedule, { foreignKey: 'loanId', as: 'emi_schedules' });

// Customer associations
Customer.hasMany(EmiCollection, { foreignKey: 'customerId', as: 'emi_collections' });
EmiCollection.belongsTo(Customer, { foreignKey: 'customerId', as: 'customers' });

// User (Collector) associations
User.hasMany(EmiCollection, { foreignKey: 'collectorId', as: 'emi_collections' });
EmiCollection.belongsTo(User, { foreignKey: 'collectorId', as: 'created_by' });

export { EmiCollection };