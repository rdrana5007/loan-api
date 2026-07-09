import { Request, Response } from "express";
import { catchResponse, errorResponse, paginate, successResponse } from "../../utils";
import { Customer, EmiCollection, EmiSchedule, Income, Loan, User } from "../../models";
import { COLLECTOR } from "../../constants";
import { sequelize } from "../../config";
import { Op } from "sequelize";

// Create Emi Collection
export const createEmiCollection = async (req: Request, res: Response): Promise<any> => {
    const collectorId = (req as any).user.id;
    const { emiScheduleId, loanId, customerId, collectedAmount, paymentMethod, transactionReference, remarks } = req.body;

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

        const emi: EmiSchedule | null = await EmiSchedule.findByPk(emiScheduleId, {
            transaction: t,
            lock: t.LOCK.UPDATE
        });
        if (!emi) return rollbackAndReturn(404, 'Emi not found');

        const [customer, collector]: [Customer | null, User | null] = await Promise.all([
            Customer.findByPk(customerId, { transaction: t }),
            User.findOne({ where: { id: collectorId, roleId: COLLECTOR }, transaction: t })
        ]);
        if (emi.loanId !== loanId) return errorResponse(res, 404, 'Loan not found');
        if (!customer) return rollbackAndReturn(404, 'Customer not found');
        if (!collector) return rollbackAndReturn(404, 'Collector not found');

        // block invalid EMI
        if (emi.status === 'paid' || Number(emi.balanceAmount) <= 0) {
            return rollbackAndReturn(404, 'EMI already fully paid');
        }

        // block overpayment
        if (Number(collectedAmount) > Number(emi.balanceAmount)) {
            return rollbackAndReturn(404, 'Amount exceeds remaining balance');
        }

        // create a new emi collection
        const emiCollection: EmiCollection = await EmiCollection.create({
            emiScheduleId,
            loanId,
            customerId,
            collectorId,
            collectedAmount,
            paymentMethod,
            transactionReference,
            remarks
        }, { transaction: t });

        const paid = Number(emi.paidAmount) + Number(collectedAmount);
        const balance = Number(emi.emiScheduleAmount) - paid;
        const isPaid = balance <= 0;

        emi.paidAmount = +(paid.toFixed(2));
        emi.balanceAmount = +(balance.toFixed(2));
        emi.status = isPaid ? 'paid' : 'partial';
        if (isPaid) emi.paidDate = new Date();

        await emi.save({ transaction: t });

        if (emi.status === 'paid' && isPaid) {
            // create admin income record
            await Income.create({
                category: 'EMI Interest',
                source: `EMI #${emiScheduleId} for Loan #${emi.loanId} by Customer #${customerId}`,
                amount: emi.interestAmount,
                remarks: 'Interest earned from EMI collection',
                createdBy: collectorId
            }, { transaction: t });
        }

        await t.commit();
        successResponse(res, 201, 'Emi collection created successful', { emiCollection, emi });
    } catch (error: any) {
        await t.rollback();
        catchResponse(res, 'Error creating the emi collection', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get all Emi Collection
export const getAllEmiCollection = async (req: Request, res: Response): Promise<any> => {
    const { id: userId, roleId: role } = (req as any).user;
    const { page, pageSize, search, sortField, sortOrder, paymentMethod } = req.query;
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

        if (paymentMethod) {
            whereClause.paymentMethod = paymentMethod;
        }

        if (searchTerm) {
            whereClause[Op.or] = [
                { transactionReference: { [Op.like]: `%${searchTerm}%` } }
            ];
        }

        const result = await paginate({
            model: EmiCollection,
            page: pageNum,
            pageSize: size,
            whereClause,
            searchQuery: searchTerm,
            searchFields: [
                'transactionReference',
                'customers.customer_code',
                'customers.first_name',
                'customers.last_name',
                'created_by.full_name'
            ],
            sortField: sortFieldStr,
            sortOrder: sortOrderStr as 'ASC' | 'DESC',
            options: {
                include: [
                    { model: Customer, as: 'customers', attributes: ['id', 'customerCode', 'firstName', 'lastName'] },
                    { model: User, as: 'created_by', attributes: ['id', 'roleId', 'fullName'] }
                ]
            }
        });

        successResponse(res, 200, 'Emi collection fetched successfully', result);
    } catch (error: any) {
        catchResponse(res, 'Error fetching emi collections', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get all Emi Collection by Loan ID
export const getEmiCollectionsByLoan = async (req: Request, res: Response): Promise<any> => {
    const loanId = Number(req.params.id);
    const { id: userId, roleId: role } = (req as any).user;
    const { page, pageSize, search, sortField, sortOrder, paymentMethod } = req.query;
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

        if (paymentMethod) {
            whereClause.paymentMethod = paymentMethod;
        }

        if (searchTerm) {
            whereClause[Op.or] = [
                { transactionReference: { [Op.like]: `%${searchTerm}%` } }
            ];
        }

        const result = await paginate({
            model: EmiCollection,
            page: pageNum,
            pageSize: size,
            whereClause,
            searchQuery: searchTerm,
            searchFields: [
                'transactionReference',
                'customers.customer_code',
                'customers.first_name',
                'customers.last_name',
                'created_by.full_name'
            ],
            sortField: sortFieldStr,
            sortOrder: sortOrderStr as 'ASC' | 'DESC',
            options: {
                include: [
                    { model: Customer, as: 'customers', attributes: ['id', 'customerCode', 'firstName', 'lastName'] },
                    { model: User, as: 'created_by', attributes: ['id', 'roleId', 'fullName'] }
                ]
            }
        });

        successResponse(res, 200, 'Emi collection fetched successfully', result);
    } catch (error: any) {
        catchResponse(res, 'Error fetching emi collections', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get Emi Collection by ID
export const getEmiCollection = async (req: Request, res: Response): Promise<any> => {
    const emiId = Number(req.params.id);
    try {
        const emi: EmiCollection | null = await EmiCollection.findByPk(emiId, {
            include: [
                { model: Customer, as: 'customers', attributes: ['id', 'customerCode', 'firstName', 'lastName'] },
                { model: User, as: 'created_by', attributes: ['id', 'roleId', 'fullName'] }
            ]
        });
        if (!emi) return errorResponse(res, 404, 'Emi collection not found');
        successResponse(res, 200, 'Emi collection fetched successfully', emi);
    } catch (error: any) {
        catchResponse(res, 'Error fetching emi collection details', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};