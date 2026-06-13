import { Request, Response } from "express";
import { catchResponse, errorResponse, paginate, successResponse } from "../../utils";
import { Expense, ExpenseRequest, User } from "../../models";
import { Op } from "sequelize";
import { COLLECTOR, MANAGER } from "../../constants";
import { sequelize } from "../../config";

// Create Expense Request
export const createExpenseRequest = async (req: Request, res: Response): Promise<any> => {
    const collectorId = (req as any).user.id;
    const { category, description, amount } = req.body;

    try {
        const collector: User | null = await User.findOne({ where: { id: collectorId, roleId: COLLECTOR } });
        if (!collector) return errorResponse(res, 404, 'Collector not found');

        // create a new expense request
        const expenseRequest: ExpenseRequest = await ExpenseRequest.create({ category, description, amount, createdBy: collectorId });

        successResponse(res, 201, 'Expense request created successful', expenseRequest);
    } catch (error: any) {
        catchResponse(res, 'Error creating the expense request', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get all Expense Request
// Collectors see only their own expense requests, while managers can view all collectors' expense requests.
export const getAllExpenseRequest = async (req: Request, res: Response): Promise<any> => {
    const { id: userId, roleId: role } = (req as any).user;
    const { page, pageSize, search, sortField, sortOrder, status } = req.query;
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const size = pageSize ? parseInt(pageSize as string, 10) : 10;
    const searchTerm = search ? (search as string) : '';
    const sortFieldStr = sortField ? (sortField as string) : 'createdAt';
    const sortOrderStr = sortOrder ? (sortOrder as string).toUpperCase() : 'DESC';

    try {
        let whereClause: any = {};

        if (role === MANAGER) {
            whereClause[Op.or] = [
                { updatedBy: userId },
                { updatedBy: null }
            ];
        }

        if (role === COLLECTOR) {
            whereClause.createdBy = userId;
        }

        if (status) {
            whereClause.status = status;
        }

        if (searchTerm) {
            whereClause = searchTerm
                ? {
                    ...whereClause,
                    [Op.or]: [
                        { category: { [Op.like]: `%${searchTerm}%` } }
                    ]
                }
                : {};
        }

        const result = await paginate({
            model: ExpenseRequest,
            page: pageNum,
            pageSize: size,
            whereClause,
            searchQuery: searchTerm,
            searchFields: ['category', 'created_by.full_name', 'updated_by.full_name'],
            sortField: sortFieldStr,
            sortOrder: sortOrderStr as 'ASC' | 'DESC',
            options: {
                include: [
                    { model: User, as: 'created_by', attributes: ['id', 'roleId', 'fullName'] },
                    { model: User, as: 'updated_by', attributes: ['id', 'roleId', 'fullName'] }
                ]
            }
        });

        successResponse(res, 200, 'Expenses request fetched successfully', result);
    } catch (error: any) {
        catchResponse(res, 'Error fetching expense requests', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Approve Expense Request by ID
export const approveExpenseRequest = async (req: Request, res: Response): Promise<any> => {
    const expenseRequestId = Number(req.params.id);
    const userId = (req as any).user.id;
    const { status } = req.body;

    const t = await sequelize.transaction();

    try {
        let rolledBack: boolean = false;
        const rollbackAndReturn = async (statusCode: number, message: string) => {
            if (!rolledBack) {
                rolledBack = true;
                await t.rollback();
            }
            return errorResponse(res, statusCode, message);
        };

        const [expenseRequest, user]: [ExpenseRequest | null, User | null] = await Promise.all([
            ExpenseRequest.findByPk(expenseRequestId),
            User.findByPk(userId)
        ]);
        if (!expenseRequest) return rollbackAndReturn(404, 'Expense request not found');
        if (!user) return rollbackAndReturn(404, 'User not found');

        let updatedExpenseRequest: ExpenseRequest | null = expenseRequest;

        const commitAndReturn = async (message: string, data: any) => {
            await t.commit();
            return successResponse(res, 200, message, data);
        };

        // APPROVE
        if (status === 'approved') {
            if (expenseRequest.status !== 'pending') return rollbackAndReturn(400, 'Only pending expense requests can be approved');

            updatedExpenseRequest = await expenseRequest.update({ status: 'approved', updatedBy: userId }, { transaction: t });

            const { category, description, amount } = updatedExpenseRequest;

            // create a new expense
            const expense: Expense = await Expense.create({ category, description, amount, createdBy: userId }, { transaction: t });

            return commitAndReturn('Expense request approved successfully', { updatedExpenseRequest, expense });
        }

        // REJECT
        else {
            if (expenseRequest.status !== 'pending') return rollbackAndReturn(400, 'Only pending expense requests can be rejected');
            updatedExpenseRequest = await expenseRequest.update({ status: 'rejected', updatedBy: userId }, { transaction: t });
            return commitAndReturn('Expense request rejected successfully', updatedExpenseRequest);
        }
    } catch (error: any) {
        catchResponse(res, 'Error approving expense request', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};