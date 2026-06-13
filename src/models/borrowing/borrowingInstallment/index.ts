import { Borrowing } from "../borrowing";
import BorrowingInstallment from "./borrowingInstallment.model";

// Borrowing associations
Borrowing.hasMany(BorrowingInstallment, { foreignKey: 'borrowingId', as: 'borrowing_installments' });
BorrowingInstallment.belongsTo(Borrowing, { foreignKey: 'borrowingId', as: 'borrowings' });

export { BorrowingInstallment };