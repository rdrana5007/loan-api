import { Router } from "express";
import { createEmiCollection, getAllEmiCollection, getEmiCollection } from "../../controllers";
import { createEmiCollectionSchema, getAllEmiCollectionSchema, idParamSchema } from "../../validations";
import { isCollector } from "../../middlewares";

const router: Router = Router();

// Create emi collection
router.post('/', isCollector, createEmiCollectionSchema, createEmiCollection);

// Get all emi collection
router.get('/', isCollector, getAllEmiCollectionSchema, getAllEmiCollection);

// Get emi collection by id
router.get('/:id', isCollector, idParamSchema, getEmiCollection);

export default router;