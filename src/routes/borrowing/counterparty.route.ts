import { Router } from "express";
import { isCollector, isManager } from "../../middlewares";
import { createCounterpartySchema, getAllCounterpartyCodeSchema, getAllCounterpartySchema, idParamSchema, updateCounterpartySchema } from "../../validations";
import { createCounterparty, deleteCounterparty, getAllCounterparty, getAllCounterpartyCode, getCounterparty, updateCounterparty } from "../../controllers";

const router: Router = Router();

// Create counterparty
router.post('/', isManager, createCounterpartySchema, createCounterparty);

// Get all counterparty
router.get('/', isCollector, getAllCounterpartySchema, getAllCounterparty);

// Get counterparty by id
router.get('/:id', isCollector, idParamSchema, getCounterparty);

// Get all counterparty code
router.get('/cp/codes', isCollector, getAllCounterpartyCodeSchema, getAllCounterpartyCode);

// Update counterparty by id
router.patch('/:id', isManager, updateCounterpartySchema, updateCounterparty);

// Delete counterparty by id
router.delete('/:id', isManager, deleteCounterparty);

export default router;