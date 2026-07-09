import { Request, Response } from "express";
import { Borrowing, BorrowingInstallment, Counterparty, User } from "../../models";
import { calculateDueDate, calculateEMILoanAmounts, catchResponse, errorResponse, generateRandomCode, paginate, successResponse } from "../../utils";
import { sequelize } from "../../config";
import { Op } from "sequelize";

// Create Borrowing
export const createBorrowing = async (req: Request, res: Response): Promise<any> => {
    const userId = (req as any).user.id;
    const { counterpartyId, principalAmount, interestRate, tenureMonths, startDate } = req.body;

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

        const [counterparty, user]: [Counterparty | null, User | null] = await Promise.all([
            Counterparty.findByPk(counterpartyId, { transaction: t }),
            User.findByPk(userId, { transaction: t }),
        ]);
        if (!counterparty) return rollbackAndReturn(404, 'Counterparty not found');
        if (!user) return rollbackAndReturn(404, 'User not found');

        if (!counterparty.isActive) return errorResponse(res, 403, 'Borrowing can only be created for active counterparties');

        const borrowingNumber: string = generateRandomCode('BR'); // Generate Borrowing Number

        const endDate: Date = calculateDueDate(startDate, tenureMonths); // Calculate Loan End Date

        // calculate borrowing amounts
        const { principal, totalInterest, totalPayable, installmentAmount } = calculateEMILoanAmounts(principalAmount, interestRate, tenureMonths);

        // create a new loan
        const borrowing: Borrowing = await Borrowing.create({
            counterpartyId,
            createdBy: userId,
            borrowingNumber,
            principalAmount: principal,
            interestRate,
            tenureMonths,
            emiAmount: installmentAmount,
            totalInterest,
            totalPayable,
            outstandingPrincipal: principal,
            outstandingInterest: totalInterest,
            startDate,
            endDate
        }, { transaction: t });

        await t.commit();
        successResponse(res, 201, 'Borrowing created successful', borrowing);
    } catch (error: any) {
        await t.rollback();
        catchResponse(res, 'Error creating the borrowing', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get all Borrowing
export const getAllBorrowing = async (req: Request, res: Response): Promise<any> => {
    const { page, pageSize, search, sortField, sortOrder, status, fromDate, toDate } = req.query;
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const size = pageSize ? parseInt(pageSize as string, 10) : 10;
    const searchTerm = search ? (search as string) : '';
    const sortFieldStr = sortField ? (sortField as string) : 'createdAt';
    const sortOrderStr = sortOrder ? (sortOrder as string).toUpperCase() : 'DESC';

    try {
        let whereClause: any = {};

        if (status) {
            whereClause.status = status;
        }

        if (searchTerm) {
            whereClause[Op.or] = [
                { borrowingNumber: { [Op.like]: `%${searchTerm}%` } }
            ];
        }

        if (fromDate || toDate) {
            const createdAtFilter: any = {};

            if (fromDate) {
                const date = new Date(fromDate as string);
                date.setHours(0, 0, 0, 0);
                createdAtFilter[Op.gte] = date;
            }

            if (toDate) {
                const date = new Date(toDate as string);
                date.setHours(23, 59, 59, 999);
                createdAtFilter[Op.lte] = date;
            }

            whereClause.createdAt = createdAtFilter;
        }

        const result = await paginate({
            model: Borrowing,
            page: pageNum,
            pageSize: size,
            whereClause,
            searchQuery: searchTerm,
            searchFields: [
                'borrowingNumber',
                'counterparties.counterparty_code',
                'counterparties.name',
                'counterparties.company_name',
                'counterparties.email',
                'created_by.full_name',
                'approved_by.full_name'
            ],
            sortField: sortFieldStr,
            sortOrder: sortOrderStr as 'ASC' | 'DESC',
            options: {
                include: [
                    {
                        model: Counterparty,
                        as: 'counterparties',
                        attributes: ['id', 'createdBy', 'counterpartyCode', 'name', 'companyName', 'email', 'phone', 'isActive']
                    },
                    { model: User, as: 'created_by', attributes: ['id', 'roleId', 'fullName'] },
                    { model: User, as: 'approved_by', attributes: ['id', 'roleId', 'fullName'] }
                ]
            }
        });

        successResponse(res, 200, 'Borrowings fetched successfully', result);
    } catch (error: any) {
        catchResponse(res, 'Error fetching borrowings', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get all Borrowing Installment by Borrowing ID
export const getAllBorrowingInstallment = async (req: Request, res: Response): Promise<any> => {
    const borrowingId = Number(req.params.id);
    const { page, pageSize, search, sortField, sortOrder, status, fromDate, toDate } = req.query;
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const size = pageSize ? parseInt(pageSize as string, 10) : 10;
    const searchTerm = search ? (search as string) : '';
    const sortFieldStr = sortField ? (sortField as string) : 'createdAt';
    const sortOrderStr = sortOrder ? (sortOrder as string).toUpperCase() : 'DESC';

    try {
        const borrowing: Borrowing | null = await Borrowing.findByPk(borrowingId);
        if (!borrowing) return errorResponse(res, 404, 'Borrowing not found');

        let whereClause: any = { borrowingId };

        if (status) {
            whereClause.status = status;
        }

        const result = await paginate({
            model: BorrowingInstallment,
            page: pageNum,
            pageSize: size,
            whereClause,
            searchQuery: searchTerm,
            searchFields: [],
            sortField: sortFieldStr,
            sortOrder: sortOrderStr as 'ASC' | 'DESC',
            options: {}
        });

        const borrowingDetail: any = {
            id: borrowing.id,
            counterpartyId: borrowing.counterpartyId,
            createdBy: borrowing.createdBy,
            borrowingNumber: borrowing.borrowingNumber
        };

        successResponse(res, 200, 'Borrowing installments fetched successfully', { borrowing: borrowingDetail, ...result });
    } catch (error: any) {
        catchResponse(res, 'Error fetching borrowing installments', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get Borrowing by ID
export const getBorrowing = async (req: Request, res: Response): Promise<any> => {
    const borrowingId = Number(req.params.id);
    try {
        const borrowing: Borrowing | null = await Borrowing.findByPk(borrowingId, {
            include: [
                {
                    model: Counterparty,
                    as: 'counterparties',
                    attributes: ['id', 'createdBy', 'counterpartyCode', 'name', 'companyName', 'email', 'phone', 'isActive']
                },
                { model: User, as: 'created_by', attributes: ['id', 'roleId', 'fullName'] },
                { model: User, as: 'approved_by', attributes: ['id', 'roleId', 'fullName'] }
            ]
        });
        if (!borrowing) return errorResponse(res, 404, 'Borrowing not found');
        successResponse(res, 200, 'Borrowing fetched successfully', borrowing);
    } catch (error: any) {
        catchResponse(res, 'Error fetching borrowing details', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Update Borrowing by ID
export const updateBorrowing = async (req: Request, res: Response): Promise<any> => {
    const borrowingId = Number(req.params.id);
    const userId = (req as any).user.id;
    const { counterpartyId, principalAmount, interestRate, tenureMonths, startDate, status } = req.body;

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

        const user: User | null = await User.findOne({ where: { id: userId }, transaction: t });
        if (!user) return rollbackAndReturn(404, 'User not found');

        let updatedBorrowing: Borrowing | null = borrowing;
        const today: Date = new Date();

        const commitAndReturn = async (message: string, data: any) => {
            await t.commit();
            return successResponse(res, 200, message, data);
        };

        // APPROVE
        if (status === 'approved') {
            if (borrowing.status !== 'pending') return rollbackAndReturn(400, 'Only pending borrowings can be approved');
            updatedBorrowing = await borrowing.update({ approvedBy: userId, status: 'approved', approvedAt: today }, { transaction: t });
            return commitAndReturn('Borrowing approved successfully', updatedBorrowing);
        }

        // REJECT
        else if (status === 'rejected') {
            if (borrowing.status !== 'pending') return rollbackAndReturn(400, 'Only pending borrowings can be rejected');
            updatedBorrowing = await borrowing.update({ status: 'rejected' }, { transaction: t });
            return commitAndReturn('Borrowing rejected successfully', updatedBorrowing);
        }

        // ACTIVATE
        else if (status === 'active') {
            if (borrowing.status !== 'approved') return rollbackAndReturn(400, 'Borrowing must be approved first');
            updatedBorrowing = await borrowing.update({ status: 'active' }, { transaction: t });
            await generateBorrowingInstallment(updatedBorrowing, t);
            return commitAndReturn('Borrowing activated successfully', updatedBorrowing);
        }

        // CLOSE
        else if (status === 'closed') {
            if (borrowing.status !== 'active') return rollbackAndReturn(400, 'Only active borrowings can be closed');

            const emiCount = await BorrowingInstallment.count({
                where: {
                    borrowingId,
                    status: { [Op.in]: ['pending', 'partial'] },
                    balanceAmount: { [Op.gt]: 0 }
                },
                transaction: t
            });
            if (emiCount > 0) return rollbackAndReturn(400, 'Borrowing cannot be closed. Some EMIs are still pending');

            updatedBorrowing = await borrowing.update({ status: 'closed' }, { transaction: t });
            return commitAndReturn('Borrowing closed successfully', updatedBorrowing);
        }

        // UPDATE
        else {
            // calculate borrowing amounts
            const { principal, totalInterest, totalPayable, installmentAmount } = calculateEMILoanAmounts(principalAmount, interestRate, tenureMonths);

            const endDate: Date = calculateDueDate(startDate, tenureMonths); // Calculate Loan End Date

            updatedBorrowing = await borrowing.update({
                counterpartyId,
                principalAmount: principal,
                interestRate,
                tenureMonths,
                emiAmount: installmentAmount,
                totalInterest,
                totalPayable,
                outstandingPrincipal: principal,
                outstandingInterest: totalInterest,
                status,
                startDate,
                endDate
            }, { transaction: t });

            return commitAndReturn('Borrowing updated successfully', updatedBorrowing);
        }
    } catch (error: any) {
        await t.rollback();
        catchResponse(res, 'Error updating borrowing', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Generates the Borrowing installment for a borrowing
async function generateBorrowingInstallment(borrowing: Borrowing, t: any) {
    const { principalAmount, interestRate, tenureMonths } = borrowing;

    // calculate borrowing amounts
    const { installmentPrincipal, installmentInterest, installmentAmount } = calculateEMILoanAmounts(principalAmount, interestRate, tenureMonths);

    const installments = [];

    for (let i = 1; i <= borrowing.tenureMonths; i++) {
        const dueDate: Date = calculateDueDate(borrowing.startDate, i); // Calculate Borrowing Due Date

        installments.push({
            borrowingId: borrowing.id,
            installmentNo: i,
            principalAmount: installmentPrincipal,
            interestAmount: installmentInterest,
            totalAmount: installmentAmount,
            paidAmount: 0,
            balanceAmount: installmentAmount,
            dueDate
        });
    }

    await BorrowingInstallment.bulkCreate(installments, { transaction: t });
};

// Delete Borrowing by ID
export const deleteBorrowing = async (req: Request, res: Response): Promise<any> => {
    const borrowingId = Number(req.params.id);
    try {
        const borrowing: Borrowing | null = await Borrowing.findByPk(borrowingId);
        if (!borrowing) return errorResponse(res, 404, 'Borrowing not found');

        await Borrowing.destroy({ where: { id: borrowingId } });
        successResponse(res, 200, 'Borrowing deleted successfully', null);
    } catch (error: any) {
        catchResponse(res, 'Error deleting borrowing', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};