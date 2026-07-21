import { User } from "../../user";
import { Customer } from "../customer";
import { EmiSchedule } from "../emiSchedule";
import { Loan } from "../loan";
import EmiFollowup from "./emiFollowup.model";

// EmiSchedule associations
EmiSchedule.hasOne(EmiFollowup, { foreignKey: 'emiScheduleId', as: 'emi_followups' });
EmiFollowup.belongsTo(EmiSchedule, { foreignKey: 'emiScheduleId', as: 'emi_schedules' });

// Loan associations
Loan.hasMany(EmiFollowup, { foreignKey: 'loanId', as: 'emi_followups' });
EmiFollowup.belongsTo(Loan, { foreignKey: 'loanId', as: 'loans' });

// Customer associations
Customer.hasMany(EmiFollowup, { foreignKey: 'customerId', as: 'emi_followups' });
EmiFollowup.belongsTo(Customer, { foreignKey: 'customerId', as: 'customers' });

// User (Collector) associations
User.hasMany(EmiFollowup, { foreignKey: 'collectorId', as: 'emi_followups' });
EmiFollowup.belongsTo(User, { foreignKey: 'collectorId', as: 'created_by' });

export { EmiFollowup };