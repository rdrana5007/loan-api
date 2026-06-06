import { Loan } from "../loan";
import EmiSchedule from "./emiSchedule.model";

// Loan associations
Loan.hasMany(EmiSchedule, { foreignKey: 'loanId', as: 'emi_schedules' });
EmiSchedule.belongsTo(Loan, { foreignKey: 'loanId', as: 'loans' });

export { EmiSchedule };