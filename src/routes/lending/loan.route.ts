import { Router } from "express";
import { createLoan, deleteLoan, getAllLoan, getLoan, updateLoan } from "../../controllers";
import { createLoanSchema, getAllLoanSchema, idParamSchema, updateLoanSchema } from "../../validations";
import { isCollector, isManager } from "../../middlewares";

const router: Router = Router();

// Create loan
router.post('/', isManager, createLoanSchema, createLoan);

// Get all loan
router.get('/', isCollector, getAllLoanSchema, getAllLoan);

// Get loan by id
router.get('/:id', isManager, idParamSchema, getLoan);

// Update loan by id
router.patch('/:id', isManager, updateLoanSchema, updateLoan);

// Delete loan by id
router.delete('/:id', isManager, deleteLoan);

export default router;