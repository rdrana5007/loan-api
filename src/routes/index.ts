import { Router } from "express";
import { auth, user } from "./user";
import { customer, emiCollection, emiFollowup, expense, expenseRequest, loan } from "./lending";
import { borrowing, borrowingPayment, counterparty } from "./borrowing";
import { dashboard } from "./dashboard";

const router: Router = Router();

router.use('/auth', auth);
router.use('/users', user);
router.use('/customers', customer);
router.use('/loans', loan);
router.use('/emi-collections', emiCollection);
router.use('/emi-followups', emiFollowup);
router.use('/expenses', expense);
router.use('/expense-requests', expenseRequest);
router.use('/counterparties', counterparty);
router.use('/borrowings', borrowing);
router.use('/borrowing-payments', borrowingPayment);
router.use('/dashboard', dashboard);

export default router;