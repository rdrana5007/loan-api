import { Router } from "express";
import { isManager } from "../../middlewares";
import { getAllIncomeSchema } from "../../validations";
import { getAllIncome } from "../../controllers/lending/income.controller";

const router: Router = Router();

// get all income
router.get('/', isManager, getAllIncomeSchema, getAllIncome);

export default router;