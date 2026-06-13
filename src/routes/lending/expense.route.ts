import { Router } from "express";
import { createExpense, deleteExpense, getAllExpense, updateExpense } from "../../controllers";
import { createExpenseSchema, getAllExpenseSchema, updateExpenseSchema } from "../../validations";
import { isAdmin, isManager } from "../../middlewares";

const router: Router = Router();

// Create expense
router.post('/', isManager, createExpenseSchema, createExpense);

// Get all expense
router.get('/', isManager, getAllExpenseSchema, getAllExpense);

// Update expense by id
router.patch('/:id', isManager, updateExpenseSchema, updateExpense);

// Delete expense by id
router.delete('/:id', isAdmin, deleteExpense);

export default router;