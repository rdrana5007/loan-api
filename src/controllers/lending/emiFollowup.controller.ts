import { Request, Response } from "express";
import { catchResponse, errorResponse, paginate, successResponse } from "../../utils";
import { Customer, EmiFollowup, EmiSchedule, Loan, User } from "../../models";
import { COLLECTOR } from "../../constants";
import { Op } from "sequelize";

// Create Emi Followup
export const createEmiFollowup = async (req: Request, res: Response): Promise<any> => {
    const collectorId = (req as any).user.id;
    const { emiScheduleId, loanId, customerId, communicationType, remarks, followUpDate, nextFollowupDate } = req.body;

    try {
        const [emi, customer, collector]: [EmiSchedule | null, Customer | null, User | null] = await Promise.all([
            EmiSchedule.findByPk(emiScheduleId),
            Customer.findByPk(customerId),
            User.findOne({ where: { id: collectorId } })
        ]);
        if (!emi) return errorResponse(res, 404, 'Emi not found');
        if (emi.loanId !== loanId) return errorResponse(res, 404, 'Loan not found');
        if (!customer) return errorResponse(res, 404, 'Customer not found');
        if (!collector) return errorResponse(res, 404, 'Collector not found');

        // create a new emi followup
        const emiFollowup: EmiFollowup = await EmiFollowup.create({
            emiScheduleId,
            loanId,
            customerId,
            collectorId,
            communicationType,
            remarks,
            followUpDate,
            nextFollowupDate
        });

        successResponse(res, 201, 'Emi followup created successful', emiFollowup);
    } catch (error: any) {
        catchResponse(res, 'Error creating the emi followup', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get all Emi Followup
export const getAllEmiFollowup = async (req: Request, res: Response): Promise<any> => {
    const { id: userId, roleId: role } = (req as any).user;
    const { page, pageSize, search, sortField, sortOrder, status } = req.query;
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const size = pageSize ? parseInt(pageSize as string, 10) : 10;
    const searchTerm = search ? (search as string) : '';
    const sortFieldStr = sortField ? (sortField as string) : 'createdAt';
    const sortOrderStr = sortOrder ? (sortOrder as string).toUpperCase() : 'DESC';

    try {
        let whereClause: any = {};

        if (role === COLLECTOR) {
            whereClause.collectorId = userId;
        }

        if (status) {
            whereClause.status = status;
        }

        if (searchTerm) {
            whereClause[Op.or] = [
                { communicationType: { [Op.like]: `%${searchTerm}%` } }
            ];
        }

        const result = await paginate({
            model: EmiFollowup,
            page: pageNum,
            pageSize: size,
            whereClause,
            searchQuery: searchTerm,
            searchFields: [
                'communicationType',
                'customers.customer_code',
                'customers.first_name',
                'customers.last_name',
                'created_by.full_name'
            ],
            sortField: sortFieldStr,
            sortOrder: sortOrderStr as 'ASC' | 'DESC',
            options: {
                include: [
                    { model: EmiSchedule, as: 'emi_schedules', attributes: ['id', 'installmentNo'] },
                    { model: Customer, as: 'customers', attributes: ['id', 'customerCode', 'firstName', 'lastName'] },
                    { model: User, as: 'created_by', attributes: ['id', 'roleId', 'fullName'] }
                ]
            }
        });

        successResponse(res, 200, 'Emi followup fetched successfully', result);
    } catch (error: any) {
        catchResponse(res, 'Error fetching emi followups', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get all Emi Followup by Loan ID
export const getEmiFollowupsByLoan = async (req: Request, res: Response): Promise<any> => {
    const loanId = Number(req.params.id);
    const { id: userId, roleId: role } = (req as any).user;
    const { page, pageSize, search, sortField, sortOrder, status } = req.query;
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const size = pageSize ? parseInt(pageSize as string, 10) : 10;
    const searchTerm = search ? (search as string) : '';
    const sortFieldStr = sortField ? (sortField as string) : 'createdAt';
    const sortOrderStr = sortOrder ? (sortOrder as string).toUpperCase() : 'DESC';

    try {
        const loan: Loan | null = await Loan.findByPk(loanId);
        if (!loan) return errorResponse(res, 404, 'Loan not found');

        let whereClause: any = { loanId };

        if (role === COLLECTOR) {
            whereClause.collectorId = userId;
        }

        if (status) {
            whereClause.status = status;
        }

        if (searchTerm) {
            whereClause[Op.or] = [
                { communicationType: { [Op.like]: `%${searchTerm}%` } }
            ];
        }

        const result = await paginate({
            model: EmiFollowup,
            page: pageNum,
            pageSize: size,
            whereClause,
            searchQuery: searchTerm,
            searchFields: [
                'communicationType',
                'customers.customer_code',
                'customers.first_name',
                'customers.last_name',
                'created_by.full_name'
            ],
            sortField: sortFieldStr,
            sortOrder: sortOrderStr as 'ASC' | 'DESC',
            options: {
                include: [
                    { model: EmiSchedule, as: 'emi_schedules', attributes: ['id', 'installmentNo'] },
                    { model: Customer, as: 'customers', attributes: ['id', 'customerCode', 'firstName', 'lastName'] },
                    { model: User, as: 'created_by', attributes: ['id', 'roleId', 'fullName'] }
                ]
            }
        });

        successResponse(res, 200, 'Emi followup fetched successfully', result);
    } catch (error: any) {
        catchResponse(res, 'Error fetching emi followups', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get Emi Followup by ID
export const getEmiFollowup = async (req: Request, res: Response): Promise<any> => {
    const followupId = Number(req.params.id);
    try {
        const followup: EmiFollowup | null = await EmiFollowup.findByPk(followupId, {
            include: [
                { model: EmiSchedule, as: 'emi_schedules', attributes: ['id', 'installmentNo'] },
                { model: Customer, as: 'customers', attributes: ['id', 'customerCode', 'firstName', 'lastName'] },
                { model: User, as: 'created_by', attributes: ['id', 'roleId', 'fullName'] }
            ]
        });
        if (!followup) return errorResponse(res, 404, 'Emi followup not found');
        successResponse(res, 200, 'Emi followup fetched successfully', followup);
    } catch (error: any) {
        catchResponse(res, 'Error fetching emi followup details', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Update Emi Followup by ID
export const updateEmiFollowup = async (req: Request, res: Response): Promise<any> => {
    const followupId = Number(req.params.id);
    const collectorId = (req as any).user.id;
    const { communicationType, status, remarks, followUpDate, nextFollowupDate } = req.body;

    try {
        const [followup, collector]: [EmiFollowup | null, User | null] = await Promise.all([
            EmiFollowup.findByPk(followupId),
            User.findOne({ where: { id: collectorId } })
        ]);
        if (!followup) return errorResponse(res, 404, 'Emi followup not found');
        if (!collector) return errorResponse(res, 404, 'Collector not found');

        if (status === 'pending') {
            await followup.update({ communicationType, remarks, followUpDate, nextFollowupDate });
        } else {
            await followup.update({ communicationType, status, remarks, nextFollowupDate: null });
        }

        successResponse(res, 200, 'Emi followup updated successfully', followup);
    } catch (error: any) {
        catchResponse(res, 'Error updating emi followup', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};