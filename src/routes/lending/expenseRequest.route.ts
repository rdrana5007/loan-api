import { Router } from "express";
import { approveExpenseRequest, createExpenseRequest, getAllExpenseRequest, getExpenseRequest } from "../../controllers";
import { approveExpenseRequestSchema, createExpenseRequestSchema, getAllExpenseRequestSchema, idParamSchema } from "../../validations";
import { isCollector, isManager } from "../../middlewares";

const router: Router = Router();

// Create expense request
router.post('/', isCollector, createExpenseRequestSchema, createExpenseRequest);

// Get all expense request
router.get('/', isCollector, getAllExpenseRequestSchema, getAllExpenseRequest);

// Get expense request by id
router.get('/:id', isCollector, idParamSchema, getExpenseRequest);

// Approve expense request by id
router.patch('/:id', isManager, approveExpenseRequestSchema, approveExpenseRequest);

export default router;