import { Router } from "express";
import { createEmiFollowup, getAllEmiFollowup, getEmiFollowup, getEmiFollowupsByLoan, updateEmiFollowup } from "../../controllers";
import { createEmiFollowupSchema, getAllEmiFollowupSchema, idParamSchema, updateEmiFollowupSchema } from "../../validations";
import { isCollector } from "../../middlewares";

const router: Router = Router();

// Create emi followup
router.post('/', isCollector, createEmiFollowupSchema, createEmiFollowup);

// Get all emi followup
router.get('/', isCollector, getAllEmiFollowupSchema, getAllEmiFollowup);

// Get all emi followup by loan id
router.get('/loans/:id', isCollector, getAllEmiFollowupSchema, getEmiFollowupsByLoan);

// Get emi followup by id
router.get('/:id', isCollector, idParamSchema, getEmiFollowup);

// Update emi followup by id
router.patch('/:id', isCollector, updateEmiFollowupSchema, updateEmiFollowup);

export default router;