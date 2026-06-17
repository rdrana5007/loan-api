import { Request, Response } from "express";
import { catchResponse, errorResponse, paginate, successResponse } from "../../utils";
import { Expense, User } from "../../models";
import { Op } from "sequelize";
import { MANAGER } from "../../constants";

// Create Expense
export const createExpense = async (req: Request, res: Response): Promise<any> => {
    const userId = (req as any).user.id;
    const { category, description, amount } = req.body;

    try {
        const user: User | null = await User.findByPk(userId);
        if (!user) return errorResponse(res, 404, 'User not found');

        // create a new expense
        const expense: Expense = await Expense.create({ category, description, amount, createdBy: userId });

        successResponse(res, 201, 'Expense created successful', expense);
    } catch (error: any) {
        catchResponse(res, 'Error creating the expense', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get all Expense
// Managers see only their own expenses, while admin can view all managers' expenses.
export const getAllExpense = async (req: Request, res: Response): Promise<any> => {
    const { id: userId, roleId: role } = (req as any).user;
    const { page, pageSize, search, sortField, sortOrder } = req.query;
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const size = pageSize ? parseInt(pageSize as string, 10) : 10;
    const searchTerm = search ? (search as string) : '';
    const sortFieldStr = sortField ? (sortField as string) : 'createdAt';
    const sortOrderStr = sortOrder ? (sortOrder as string).toUpperCase() : 'DESC';

    try {
        let whereClause: any = {};

        if (role === MANAGER) {
            whereClause.createdBy = userId;
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
            model: Expense,
            page: pageNum,
            pageSize: size,
            whereClause,
            searchQuery: searchTerm,
            searchFields: ['category', 'created_by.full_name'],
            sortField: sortFieldStr,
            sortOrder: sortOrderStr as 'ASC' | 'DESC',
            options: { include: [{ model: User, as: 'created_by', attributes: ['id', 'roleId', 'fullName'] }] }
        });

        successResponse(res, 200, 'Expenses fetched successfully', result);
    } catch (error: any) {
        catchResponse(res, 'Error fetching expenses', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get Expense by ID
export const getExpense = async (req: Request, res: Response): Promise<any> => {
    const expenseId = Number(req.params.id);
    try {
        const expense: Expense | null = await Expense.findByPk(expenseId, {
            include: [{ model: User, as: 'created_by', attributes: ['id', 'roleId', 'fullName'] }]
        });
        if (!expense) return errorResponse(res, 404, 'Expense not found');
        successResponse(res, 200, 'Expense fetched successfully', expense);
    } catch (error: any) {
        catchResponse(res, 'Error fetching expense details', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Update Expense by ID
export const updateExpense = async (req: Request, res: Response): Promise<any> => {
    const expenseId = Number(req.params.id);
    const { category, description, amount } = req.body;

    try {
        const expense: Expense | null = await Expense.findByPk(expenseId);
        if (!expense) return errorResponse(res, 404, 'Expense not found');

        await expense.update({ category, description, amount });
        successResponse(res, 200, 'Expense updated successfully', expense);
    } catch (error: any) {
        catchResponse(res, 'Error updating expense', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Delete Expense by ID
export const deleteExpense = async (req: Request, res: Response): Promise<any> => {
    const expenseId = Number(req.params.id);
    try {
        const expense: Expense | null = await Expense.findByPk(expenseId);
        if (!expense) return errorResponse(res, 404, 'Expense not found');

        await Expense.destroy({ where: { id: expenseId } });
        successResponse(res, 200, 'Expense deleted successfully', null);
    } catch (error: any) {
        catchResponse(res, 'Error deleting expense', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};