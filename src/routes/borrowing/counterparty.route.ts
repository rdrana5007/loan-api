import { Router } from "express";
import { isManager } from "../../middlewares";
import { createCounterpartySchema, getAllCounterpartySchema, idParamSchema, updateCounterpartySchema } from "../../validations";
import { createCounterparty, deleteCounterparty, getAllCounterparty, getCounterparty, updateCounterparty } from "../../controllers";

const router: Router = Router();

// Create counterparty
router.post('/', isManager, createCounterpartySchema, createCounterparty);

// Get all counterparty
router.get('/', isManager, getAllCounterpartySchema, getAllCounterparty);

// Get counterparty by id
router.get('/:id', isManager, idParamSchema, getCounterparty);

// Update counterparty by id
router.patch('/:id', isManager, updateCounterpartySchema, updateCounterparty);

// Delete counterparty by id
router.delete('/:id', isManager, deleteCounterparty);

export default router;