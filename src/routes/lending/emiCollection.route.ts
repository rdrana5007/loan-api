import { Router } from "express";
import { createEmiCollection, getAllEmiCollection } from "../../controllers";
import { createEmiCollectionSchema, getAllEmiCollectionSchema } from "../../validations";
import { isCollector } from "../../middlewares";

const router: Router = Router();

// Create emi collection
router.post('/', isCollector, createEmiCollectionSchema, createEmiCollection);

// Get all emi collection
router.get('/', isCollector, getAllEmiCollectionSchema, getAllEmiCollection);

export default router;