import { Router } from "express";
import { createBorrowingPayment, getAllBorrowingPayment } from "../../controllers";
import { createBorrowingPaymentSchema, getAllBorrowingPaymentSchema } from "../../validations";
import { isCollector } from "../../middlewares";

const router: Router = Router();

// Create borrowing payment
router.post('/', isCollector, createBorrowingPaymentSchema, createBorrowingPayment);

// Get all borrowing payment
router.get('/', isCollector, getAllBorrowingPaymentSchema, getAllBorrowingPayment);

export default router;