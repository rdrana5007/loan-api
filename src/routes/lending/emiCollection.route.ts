import { Router } from "express";
import { createEmiCollection, getAllEmiCollection, getEmiCollection, getEmiCollectionsByLoan } from "../../controllers";
import { createEmiCollectionSchema, getAllEmiCollectionSchema, idParamSchema } from "../../validations";
import { isCollector } from "../../middlewares";

const router: Router = Router();

// Create emi collection
router.post('/', isCollector, createEmiCollectionSchema, createEmiCollection);

// Get all emi collection
router.get('/', isCollector, getAllEmiCollectionSchema, getAllEmiCollection);

// Get all emi collection by loan id
router.get('/loans/:id', isCollector, getAllEmiCollectionSchema, getEmiCollectionsByLoan);

// Get emi collection by id
router.get('/:id', isCollector, idParamSchema, getEmiCollection);

export default router;