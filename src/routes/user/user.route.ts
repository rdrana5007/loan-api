import { Router } from "express";
import { createUser, deleteUser, getAllUser, updateUser } from "../../controllers";
import { createUserSchema, getAllUserSchema, updateUserSchema } from "../../validations";
import { isManager } from "../../middlewares";

const router: Router = Router();

// Create user
router.post('/', isManager, createUserSchema, createUser);

// Get all user
router.get('/', isManager, getAllUserSchema, getAllUser);

// Update user by id
router.patch('/:id', isManager, updateUserSchema, updateUser);

// Delete user by id
router.delete('/:id', isManager, deleteUser);

export default router;