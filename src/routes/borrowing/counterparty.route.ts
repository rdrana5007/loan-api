import { Router } from "express";
import { isManager } from "../../middlewares";
import { createCounterpartySchema, getAllCounterpartySchema, updateCounterpartySchema } from "../../validations";
import { createCounterparty, deleteCounterparty, getAllCounterparty, updateCounterparty } from "../../controllers";

const router: Router = Router();

// Create counterparty
router.post('/', isManager, createCounterpartySchema, createCounterparty);

// Get all counterparty
router.get('/', isManager, getAllCounterpartySchema, getAllCounterparty);

// Update counterparty by id
router.patch('/:id', isManager, updateCounterpartySchema, updateCounterparty);

// Delete counterparty by id
router.delete('/:id', isManager, deleteCounterparty);

export default router;