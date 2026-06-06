import { Router } from "express";
import { createEmiFollowup, updateEmiFollowup } from "../../controllers";
import { createEmiFollowupSchema, updateEmiFollowupSchema } from "../../validations";
import { isCollector } from "../../middlewares";

const router: Router = Router();

// Create emi followup
router.post('/', isCollector, createEmiFollowupSchema, createEmiFollowup);

// // Get all emi followup
// router.get('/', isManager, getAllLoanSchema, getAllLoan);

// Update emi followup by id
router.patch('/:id', isCollector, updateEmiFollowupSchema, updateEmiFollowup);

export default router;