import { Router } from "express";
import { createEmiFollowup, getAllEmiFollowup, updateEmiFollowup } from "../../controllers";
import { createEmiFollowupSchema, getAllEmiFollowupSchema, updateEmiFollowupSchema } from "../../validations";
import { isCollector } from "../../middlewares";

const router: Router = Router();

// Create emi followup
router.post('/', isCollector, createEmiFollowupSchema, createEmiFollowup);

// Get all emi followup
router.get('/', isCollector, getAllEmiFollowupSchema, getAllEmiFollowup);

// Update emi followup by id
router.patch('/:id', isCollector, updateEmiFollowupSchema, updateEmiFollowup);

export default router;