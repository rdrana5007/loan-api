import { User } from "../../user";
import { Borrowing } from "../borrowing";
import { BorrowingInstallment } from "../borrowingInstallment";
import BorrowingPayment from "./borrowingPayment.model";

// Borrowing associations
Borrowing.hasMany(BorrowingPayment, { foreignKey: 'borrowingId', as: 'borrowing_payments' });
BorrowingPayment.belongsTo(Borrowing, { foreignKey: 'borrowingId', as: 'borrowings' });

// Borrowing Installment associations
BorrowingInstallment.hasMany(BorrowingPayment, { foreignKey: 'installmentId', as: 'borrowing_payments' });
BorrowingPayment.belongsTo(BorrowingInstallment, { foreignKey: 'installmentId', as: 'borrowing_installments' });

// User (Admin, Manager, Collector) associations
User.hasMany(BorrowingPayment, { foreignKey: 'createdBy', as: 'borrowing_payments' });
BorrowingPayment.belongsTo(User, { foreignKey: 'createdBy', as: 'created_by' });

export { BorrowingPayment };