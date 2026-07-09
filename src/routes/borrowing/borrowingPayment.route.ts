import { Router } from "express";
import { createBorrowingPayment, getAllBorrowingPayment, getBorrowingPayment, getBorrowingPaymentsByBorrowing } from "../../controllers";
import { createBorrowingPaymentSchema, getAllBorrowingPaymentSchema, idParamSchema } from "../../validations";
import { isCollector } from "../../middlewares";

const router: Router = Router();

// Create borrowing payment
router.post('/', isCollector, createBorrowingPaymentSchema, createBorrowingPayment);

// Get all borrowing payment
router.get('/', isCollector, getAllBorrowingPaymentSchema, getAllBorrowingPayment);

// Get all borrowing payment by borrowing id
router.get('/borrowings/:id', isCollector, getAllBorrowingPaymentSchema, getBorrowingPaymentsByBorrowing);

// Get borrowing payment by id
router.get('/:id', isCollector, idParamSchema, getBorrowingPayment);

export default router;