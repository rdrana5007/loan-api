import { Router } from "express";
import { createBorrowingPayment, getAllBorrowingPayment, getBorrowingPayment } from "../../controllers";
import { createBorrowingPaymentSchema, getAllBorrowingPaymentSchema, idParamSchema } from "../../validations";
import { isCollector } from "../../middlewares";

const router: Router = Router();

// Create borrowing payment
router.post('/', isCollector, createBorrowingPaymentSchema, createBorrowingPayment);

// Get borrowing payment by id
router.get('/:id', isCollector, idParamSchema, getBorrowingPayment);

// Get all borrowing payment
router.get('/', isCollector, getAllBorrowingPaymentSchema, getAllBorrowingPayment);

export default router;