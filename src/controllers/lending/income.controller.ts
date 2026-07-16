import { Request, Response } from "express";
import { Op } from "sequelize";
import { catchResponse, paginate, successResponse } from "../../utils";
import { Income, User } from "../../models";
import { MANAGER } from "../../constants";

// Get all Income
export const getAllIncome = async (req: Request, res: Response): Promise<any> => {
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
                        { category: { [Op.like]: `%${searchTerm}%` } },
                        { source: { [Op.like]: `%${searchTerm}%` } }
                    ]
                }
                : {};
        }

        const result = await paginate({
            model: Income,
            page: pageNum,
            pageSize: size,
            whereClause,
            searchQuery: searchTerm,
            searchFields: ['category', 'source', 'created_by.full_name'],
            sortField: sortFieldStr,
            sortOrder: sortOrderStr as 'ASC' | 'DESC',
            options: { include: [{ model: User, as: 'created_by', attributes: ['id', 'roleId', 'fullName'] }] }
        });

        successResponse(res, 200, 'Incomes fetched successfully', result);
    } catch (error: any) {
        catchResponse(res, 'Error fetching incomes', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};