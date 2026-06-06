import { Router } from "express";
import { createLoan, deleteLoan, getAllLoan, getLoanById, updateLoan } from "../../controllers";
import { createLoanSchema, getAllLoanSchema, getLoanByIdSchema, updateLoanSchema } from "../../validations";
import { isManager } from "../../middlewares";

const router: Router = Router();

// Create loan
router.post('/', isManager, createLoanSchema, createLoan);

// Get all loan
router.get('/', isManager, getAllLoanSchema, getAllLoan);

// Get loan by id
router.get('/:id', isManager, getLoanByIdSchema, getLoanById);

// Update loan by id
router.patch('/:id', isManager, updateLoanSchema, updateLoan);

// Delete loan by id
router.delete('/:id', isManager, deleteLoan);

export default router;