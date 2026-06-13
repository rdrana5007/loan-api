import { Router } from "express";
import { approveExpenseRequest, createExpenseRequest, getAllExpenseRequest } from "../../controllers";
import { approveExpenseRequestSchema, createExpenseRequestSchema, getAllExpenseRequestSchema } from "../../validations";
import { isCollector, isManager } from "../../middlewares";

const router: Router = Router();

// Create expense request
router.post('/', isCollector, createExpenseRequestSchema, createExpenseRequest);

// Get all expense request
router.get('/', isCollector, getAllExpenseRequestSchema, getAllExpenseRequest);

// Approve expense request by id
router.patch('/:id', isManager, approveExpenseRequestSchema, approveExpenseRequest);

export default router;