import { Router } from "express";
import { createBorrowing, deleteBorrowing, getAllBorrowing, getAllBorrowingInstallment, getBorrowing, updateBorrowing } from "../../controllers";
import { createBorrowingSchema, getAllBorrowingInstallmentSchema, getAllBorrowingSchema, idParamSchema, updateBorrowingSchema } from "../../validations";
import { isCollector, isManager } from "../../middlewares";

const router: Router = Router();

// Create borrowing
router.post('/', isManager, createBorrowingSchema, createBorrowing);

// Get all borrowing
router.get('/', isCollector, getAllBorrowingSchema, getAllBorrowing);

// Get all emi schedule by loan id
router.get('/:id/borrowing-installments', isCollector, getAllBorrowingInstallmentSchema, getAllBorrowingInstallment);

// Get borrowing by id
router.get('/:id', isCollector, idParamSchema, getBorrowing);

// Update borrowing by id
router.patch('/:id', isManager, updateBorrowingSchema, updateBorrowing);

// Delete borrowing by id
router.delete('/:id', isManager, deleteBorrowing);

export default router;