import { Router } from "express";
import { getDashboardSummary, getLastSixMonthExpenseIncome, getStatusSummary } from "../../controllers";

const router: Router = Router();

// Get dashboard summary
router.get('/summary', getDashboardSummary);

// Get status summary
router.get('/status-summary', getStatusSummary);

// Get last six month expense income summary
router.get('/expense-income-summary', getLastSixMonthExpenseIncome);

export default router;