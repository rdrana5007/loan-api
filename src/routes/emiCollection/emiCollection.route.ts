import { Router } from "express";
import { createEmiCollection } from "../../controllers";
import { createEmiCollectionSchema } from "../../validations";
import { isCollector } from "../../middlewares";

const router: Router = Router();

// Create emi collection
router.post('/', isCollector, createEmiCollectionSchema, createEmiCollection);

// // Get all emi collection
// router.get('/', isManager, getAllLoanSchema, getAllLoan);

export default router;