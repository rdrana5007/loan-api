import { Request, Response } from "express";
import { catchResponse, errorResponse, paginate, successResponse } from "../../utils";
import { Borrowing, BorrowingInstallment, BorrowingPayment, Expense, User } from "../../models";
import { sequelize } from "../../config";
import { COLLECTOR } from "../../constants";
import { Op } from "sequelize";

// Create Borrowing Payment
export const createBorrowingPayment = async (req: Request, res: Response): Promise<any> => {
    const userId = (req as any).user.id;
    const { borrowingId, installmentId, amount, paymentMethod, transactionReference, remarks } = req.body;

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

        const borrowing: Borrowing | null = await Borrowing.findByPk(borrowingId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!borrowing) return rollbackAndReturn(404, 'Borrowing not found');

        const installment: BorrowingInstallment | null = await BorrowingInstallment.findByPk(installmentId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!installment) return rollbackAndReturn(404, 'Installment not found');

        const user: User | null = await User.findOne({ where: { id: userId }, transaction: t });
        if (!user) return rollbackAndReturn(404, 'User not found');

        // block invalid EMI
        if (installment.status === 'paid' || Number(installment.balanceAmount) <= 0) {
            return rollbackAndReturn(404, 'Installment already fully paid');
        }

        // block overpayment
        if (Number(amount) > Number(installment.balanceAmount)) {
            return rollbackAndReturn(404, 'Amount exceeds remaining balance');
        }

        // create a new borrowing payment
        const borrowingPayment: BorrowingPayment = await BorrowingPayment.create({
            borrowingId,
            installmentId,
            amount,
            paymentMethod,
            transactionReference,
            remarks,
            createdBy: userId
        }, { transaction: t });

        const paid = Number(installment.paidAmount) + Number(amount);
        const balance = Number(installment.totalAmount) - paid;
        const isPaid = balance <= 0;

        installment.paidAmount = paid;
        installment.balanceAmount = balance;
        installment.status = isPaid ? 'paid' : 'partial';
        if (isPaid) installment.paidDate = new Date();

        await installment.save({ transaction: t });

        if (installment.status === 'paid' && isPaid) {
            let outstandingPrincipal: number = Number(borrowing.outstandingPrincipal) - Number(installment.principalAmount);
            let outstandingInterest: number = Number(borrowing.outstandingInterest) - Number(installment.interestAmount);

            await borrowing.update({
                outstandingPrincipal,
                outstandingInterest
            }, { transaction: t });
        }

        if (installment.status === 'paid' && isPaid) {
            // create admin expense record
            await Expense.create({
                createdBy: userId,
                category: 'Interest Expense',
                description: 'Interest paid on borrowing installment to counterparty.',
                amount: installment.interestAmount
            }, { transaction: t });
        }

        await t.commit();
        successResponse(res, 201, 'Borrowing payment created successful', { borrowingPayment, installment });
    } catch (error: any) {
        await t.rollback();
        catchResponse(res, 'Error creating the borrowing payment', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get all Borrowing Payment
export const getAllBorrowingPayment = async (req: Request, res: Response): Promise<any> => {
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
            whereClause.createdBy = userId;
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
            model: BorrowingPayment,
            page: pageNum,
            pageSize: size,
            whereClause,
            searchQuery: searchTerm,
            searchFields: ['transactionReference', 'created_by.full_name'],
            sortField: sortFieldStr,
            sortOrder: sortOrderStr as 'ASC' | 'DESC',
            options: { include: [{ model: User, as: 'created_by', attributes: ['id', 'roleId', 'fullName'] }] }
        });

        successResponse(res, 200, 'Borrowing Payment fetched successfully', result);
    } catch (error: any) {
        catchResponse(res, 'Error fetching borrowing payments', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get Borrowing Payment by ID
export const getBorrowingPayment = async (req: Request, res: Response): Promise<any> => {
    const borrowingPaymentId = Number(req.params.id);
    try {
        const borrowingPayment: BorrowingPayment | null = await BorrowingPayment.findByPk(borrowingPaymentId, {
            include: [{ model: User, as: 'created_by', attributes: ['id', 'roleId', 'fullName'] }]
        });
        if (!borrowingPayment) return errorResponse(res, 404, 'Borrowing payment not found');
        successResponse(res, 200, 'Borrowing payment fetched successfully', borrowingPayment);
    } catch (error: any) {
        catchResponse(res, 'Error fetching borrowing payment details', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};