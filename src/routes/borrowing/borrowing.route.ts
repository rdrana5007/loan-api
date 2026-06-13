import { Router } from "express";
import { createBorrowing, deleteBorrowing, getAllBorrowing, updateBorrowing } from "../../controllers";
import { createBorrowingSchema, getAllBorrowingSchema, updateBorrowingSchema } from "../../validations";
import { isManager } from "../../middlewares";

const router: Router = Router();

// Create borrowing
router.post('/', isManager, createBorrowingSchema, createBorrowing);

// Get all borrowing
router.get('/', isManager, getAllBorrowingSchema, getAllBorrowing);

// Update borrowing by id
router.patch('/:id', isManager, updateBorrowingSchema, updateBorrowing);

// Delete borrowing by id
router.delete('/:id', isManager, deleteBorrowing);

export default router;