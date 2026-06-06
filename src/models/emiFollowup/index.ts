import { Customer } from "../customer";
import { EmiSchedule } from "../emiSchedule";
import { Loan } from "../loan";
import { User } from "../user";
import EmiFollowUp from "./emiFollowup.model";

// EmiSchedule associations
EmiSchedule.hasMany(EmiFollowUp, { foreignKey: 'emiScheduleId', as: 'emi_followups' });
EmiFollowUp.belongsTo(EmiSchedule, { foreignKey: 'emiScheduleId', as: 'emi_schedules' });

// Loan associations
Loan.hasMany(EmiFollowUp, { foreignKey: 'loanId', as: 'emi_followups' });
EmiFollowUp.belongsTo(Loan, { foreignKey: 'loanId', as: 'loans' });

// Customer associations
Customer.hasMany(EmiFollowUp, { foreignKey: 'customerId', as: 'emi_followups' });
EmiFollowUp.belongsTo(Customer, { foreignKey: 'customerId', as: 'customes' });

// User(Collector) associations
User.hasMany(EmiFollowUp, { foreignKey: 'collectorId', as: 'emi_followups' });
EmiFollowUp.belongsTo(User, { foreignKey: 'collectorId', as: 'users' });

export { EmiFollowUp };