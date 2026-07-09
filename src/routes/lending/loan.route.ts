import { Router } from "express";
import { createLoan, deleteLoan, getAllEmiSchedule, getAllLoan, getLoan, updateLoan } from "../../controllers";
import { createLoanSchema, getAllEmiScheduleSchema, getAllLoanSchema, idParamSchema, updateLoanSchema } from "../../validations";
import { isCollector, isManager } from "../../middlewares";

const router: Router = Router();

// Create loan
router.post('/', isManager, createLoanSchema, createLoan);

// Get all loan
router.get('/', isCollector, getAllLoanSchema, getAllLoan);

// Get all emi schedule by loan id
router.get('/:id/emi-schedules', isCollector, getAllEmiScheduleSchema, getAllEmiSchedule);

// Get loan by id
router.get('/:id', isCollector, idParamSchema, getLoan);

// Update loan by id
router.patch('/:id', isManager, updateLoanSchema, updateLoan);

// Delete loan by id
router.delete('/:id', isManager, deleteLoan);

export default router;