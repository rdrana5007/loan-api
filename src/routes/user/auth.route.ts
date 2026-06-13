import { Router } from "express";
import { getUserProfile, loginUser } from "../../controllers";
import { loginSchema } from "../../validations";
import { authMiddleware } from "../../middlewares";

const router: Router = Router();

// login user
router.post('/login', loginSchema, loginUser);

// get user profile
router.get('/profile', authMiddleware, getUserProfile);

export default router;