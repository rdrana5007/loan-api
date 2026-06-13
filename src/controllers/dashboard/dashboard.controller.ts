import { Request, Response } from "express";
import { Borrowing, Counterparty, Customer, EmiCollection, EmiFollowUp, Expense, ExpenseRequest, Income, Loan, User } from "../../models";
import { arrayToMonthMap, catchResponse, getDateRange, getLast6Months, getStatusCounts, successResponse } from "../../utils";
import { allEmiFollowupStatus, allLoanStatus, COLLECTOR, MANAGER } from "../../constants";
import { sequelize } from "../../config";
import { Op, WhereOptions } from "sequelize";

// Get Dashboard summary
export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
    const period = (req.query.period as string) || 'today';
    try {
        const startDate: Date = getDateRange(period); // get the start date for dashboard period filters
        const dateFilter: WhereOptions = { createdAt: { [Op.gte]: startDate } };

        const [
            totalCustomers,
            customersInPeriod,
            totalCounterparties,
            counterpartiesInPeriod,
            totalManagers,
            managersInPeriod,
            totalCollectors,
            collectorsInPeriod,
            totalLoans,
            loansInPeriod,
            pendingLoans,
            activeLoans,
            closedLoans,
            emiCollected,
            totalBorrowings,
            borrowingsInPeriod,
            pendingBorrowings,
            totalExpenses,
            totalIncome,
            totalExpenseRequests,
            expenseRequestsInPeriod,
            pendingExpenseRequests
        ] = await Promise.all([
            Customer.count(),
            Customer.count({ where: dateFilter }),
            Counterparty.count(),
            Counterparty.count({ where: dateFilter }),
            User.count({ where: { roleId: MANAGER } }),
            User.count({ where: { roleId: MANAGER, ...dateFilter }  }),
            User.count({ where: { roleId: COLLECTOR } }),
            User.count({ where: { roleId: COLLECTOR, ...dateFilter } }),
            Loan.count(),
            Loan.count({ where: dateFilter }),
            Loan.count({ where: { status: 'pending', ...dateFilter } }),
            Loan.count({ where: { status: 'active', ...dateFilter } }),
            Loan.count({ where: { status: 'closed', ...dateFilter } }),
            EmiCollection.sum('collectedAmount', { where: dateFilter }),
            Borrowing.count(),
            Borrowing.count({ where: dateFilter }),
            Borrowing.count({ where: { status: 'pending', ...dateFilter } }),
            Expense.sum('amount', { where: dateFilter }),
            Income.sum('amount', { where: dateFilter }),
            ExpenseRequest.count(),
            ExpenseRequest.count({ where: dateFilter }),
            ExpenseRequest.count({ where: { status: 'pending', ...dateFilter } })
        ]);

        const netIncome: number = (totalIncome || 0) - (totalExpenses || 0);
        const isProfit: boolean = netIncome >= 0;;
        const profit: number = isProfit ? netIncome : 0;
        const loss: number = !isProfit ? -netIncome : 0;

        const result = {
            customers: {
                total: totalCustomers,
                inPeriod: customersInPeriod
            },
            counterparties: {
                total: totalCounterparties,
                inPeriod: counterpartiesInPeriod
            },
            users: {
                managers: {
                    total: totalManagers,
                    inPeriod: managersInPeriod
                },
                collectors: {
                    total: totalCollectors,
                    inPeriod: collectorsInPeriod
                }
            },
            loans: {
                total: totalLoans,
                inPeriod: loansInPeriod,
                pending: pendingLoans,
                active: activeLoans,
                closed: closedLoans
            },
            emiCollected: Number(emiCollected || 0),
            borrowings: {
                total: totalBorrowings,
                inPeriod: borrowingsInPeriod,
                pending: pendingBorrowings
            },
            finance: {
                expense: Number(totalExpenses || 0),
                income: Number(totalIncome || 0),
                netIncome,
                profit,
                loss
            },
            expenseRequests: {
                total: totalExpenseRequests,
                inPeriod: expenseRequestsInPeriod,
                pending: pendingExpenseRequests
            }
        };

        successResponse(res, 200, 'Dashboard summary fetched successfully', result);
    } catch (error: any) {
        catchResponse(res, 'Error fetching dashboard summary', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get Status summary
export const getStatusSummary = async (req: Request, res: Response): Promise<void> => {
    const period = (req.query.period as string) || 'today';
    try {
        const startDate: Date = getDateRange(period); // get the start date for dashboard period filters
        const dateFilter: WhereOptions = { createdAt: { [Op.gte]: startDate } };

        const [loan, borrowing, emiFollowup] = await Promise.all([
            getStatusCounts(Loan, allLoanStatus, dateFilter),
            getStatusCounts(Borrowing, allLoanStatus, dateFilter),
            getStatusCounts(EmiFollowUp, allEmiFollowupStatus, dateFilter)
        ]);

        const result = { loan, borrowing, emiFollowup };

        successResponse(res, 200, 'Status summary fetched successfully', result);
    } catch (error: any) {
        catchResponse(res, 'Error fetching status summary', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get last six month Expense Income summary
export const getLastSixMonthExpenseIncome = async (req: Request, res: Response): Promise<void> => {
    try {
        // Fetch Income
        const incomeData = await Income.findAll({
            attributes: [
                [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'month'],
                [sequelize.fn('SUM', sequelize.col('amount')), 'total']
            ],
            group: ['month'],
            raw: true
        });

        // Fetch Expense
        const expenseData = await Expense.findAll({
            attributes: [
                [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'month'],
                [sequelize.fn('SUM', sequelize.col('amount')), 'total']
            ],
            group: ['month'],
            raw: true
        });

        const months = getLast6Months();
        const incomeMap = arrayToMonthMap(incomeData);
        const expenseMap = arrayToMonthMap(expenseData);

        const chartData = months.map((month) => ({
            month,
            income: incomeMap[month] || 0,
            expense: expenseMap[month] || 0
        }));

        successResponse(res, 200, 'Expense Income summary fetched successfully', chartData);
    } catch (error: any) {
        catchResponse(res, 'Error fetching expense income summary', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};



// New Customers

// Active Loans
// Closed Loans
// Total Borrowings

// Pending Loan Approvals
// Pending Borrowing Approvals
// Today's Collections

// Show total income vs total expense
// Show profit/loss per month


// Today
// Last 7 Days
// Last 15 Days
// Last Month
// Last 3 Months
// Last 6 Months
// Last Year