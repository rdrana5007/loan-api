import { Request, Response } from "express";
import { catchResponse, errorResponse, paginate, successResponse } from "../../utils";
import { Customer, EmiCollection, EmiCollectionItem, EmiSchedule, Income, Loan, User } from "../../models";
import { COLLECTOR } from "../../constants";
import { sequelize } from "../../config";
import { Op } from "sequelize";

// Create Emi Collection
export const createEmiCollection = async (req: Request, res: Response): Promise<any> => {
    const collectorId = (req as any).user.id;
    const { loanId, customerId, totalAmount, paymentMethod, transactionReference, remarks } = req.body;

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

        const emis = await EmiSchedule.findAll({
            where: {
                loanId,
                status: { [Op.ne]: 'paid' }
            },
            order: [['installmentNo', 'ASC']],
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        if (!emis.length) return rollbackAndReturn(404, 'No pending EMI found');

        // Validate total amount
        const totalPendingAmount = emis.reduce((sum, emi) => sum + Number(emi.balanceAmount), 0);
        if (Number(totalAmount) > totalPendingAmount) {
            return rollbackAndReturn(400, `Total amount cannot exceed pending amount (${totalPendingAmount}).`);
        }

        const [customer, collector, loan]: [Customer | null, User | null, Loan | null] = await Promise.all([
            Customer.findByPk(customerId, { transaction: t }),
            User.findOne({ where: { id: collectorId }, transaction: t }),
            Loan.findByPk(loanId, { transaction: t })
        ]);
        if (!customer) return rollbackAndReturn(404, 'Customer not found');
        if (!collector) return rollbackAndReturn(404, 'Collector not found');
        if (!loan) return rollbackAndReturn(404, 'Loan not found');

        // create a new emi collection
        const emiCollection: EmiCollection = await EmiCollection.create({
            loanId,
            customerId,
            collectorId,
            totalAmount,
            paymentMethod,
            transactionReference,
            remarks
        }, { transaction: t });

        const collectionItems: {
            emiCollectionId: number;
            emiScheduleId: number;
            amount: number;
        }[] = [];

        const incomes: {
            category: string;
            source: string;
            amount: number;
            remarks: string;
            createdBy: number;
        }[] = [];

        let remaining = Number(totalAmount);

        for (const emi of emis) {
            if (remaining <= 0) break;

            const balance = Number(emi.balanceAmount);

            if (balance <= 0) continue;

            const amountToPay = Math.min(balance, remaining);

            collectionItems.push({
                emiCollectionId: emiCollection.id,
                emiScheduleId: emi.id,
                amount: Number(amountToPay)
            });

            const paidAmount = Number(emi.paidAmount) + amountToPay;
            const newBalance = Number(emi.balanceAmount) - amountToPay;

            emi.paidAmount = paidAmount;
            emi.balanceAmount = newBalance;

            if (newBalance <= 0) {
                emi.status = "paid";
                emi.paidDate = new Date();

                // create admin income record
                incomes.push({
                    category: 'EMI Interest',
                    source: `EMI #${emi.id} for Loan #${emi.loanId} by Customer #${customerId}`,
                    amount: Number(emi.interestAmount),
                    remarks: 'Interest earned from EMI collection',
                    createdBy: collectorId
                });
            } else {
                emi.status = 'partial';
            }

            await emi.save({ transaction: t });

            remaining -= amountToPay;
        }

        if (collectionItems.length) {
            await EmiCollectionItem.bulkCreate(collectionItems, { transaction: t });
        }

        if (incomes.length) {
            await Income.bulkCreate(incomes, { transaction: t });
        }

        await t.commit();
        successResponse(res, 201, 'Emi collection created successful', emiCollection);
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
                    {
                        model: EmiCollectionItem,
                        as: 'emi_collection_items',
                        include: [
                            {
                                model: EmiSchedule,
                                as: 'emi_schedules',
                                attributes: ['id', 'installmentNo', 'emiScheduleAmount', 'dueDate']
                            }
                        ]
                    },
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
                    {
                        model: EmiCollectionItem,
                        as: 'emi_collection_items',
                        include: [
                            {
                                model: EmiSchedule,
                                as: 'emi_schedules',
                                attributes: ['id', 'installmentNo', 'emiScheduleAmount', 'dueDate']
                            }
                        ]
                    },
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
                {
                    model: EmiCollectionItem,
                    as: 'emi_collection_items',
                    include: [
                        {
                            model: EmiSchedule,
                            as: 'emi_schedules',
                            attributes: ['id', 'installmentNo', 'emiScheduleAmount', 'dueDate']
                        }
                    ]
                },
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