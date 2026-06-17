import { Router } from "express";
import { createUser, deleteUser, getAllUser, getUser, updateUser } from "../../controllers";
import { createUserSchema, getAllUserSchema, idParamSchema, updateUserSchema } from "../../validations";
import { isManager } from "../../middlewares";

const router: Router = Router();

// Create user
router.post('/', isManager, createUserSchema, createUser);

// Get all user
router.get('/', isManager, getAllUserSchema, getAllUser);

// Get user by id
router.get('/:id', isManager, idParamSchema, getUser);

// Update user by id
router.patch('/:id', isManager, updateUserSchema, updateUser);

// Delete user by id
router.delete('/:id', isManager, deleteUser);

export default router;