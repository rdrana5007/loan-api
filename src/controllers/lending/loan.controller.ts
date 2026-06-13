import { Request, Response } from "express";
import { Customer, CustomerDocuments, EmiSchedule, Income, Loan, User } from "../../models";
import { calculateDueDate, calculateEMIBorrowingAmounts, catchResponse, errorResponse, generateRandomCode, paginate, successResponse } from "../../utils";
import { Op } from "sequelize";
import { COLLECTOR, MANAGER } from "../../constants";
import { sequelize } from "../../config";

// Create Loan
export const createLoan = async (req: Request, res: Response): Promise<any> => {
    const managerId = (req as any).user.id;
    const { customerId, collectorId, loanAmount, interestRate, tenureMonths, processingFee, startDate, notes } = req.body;

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

        const [customer, collector, manager]: [Customer | null, User | null, User | null] = await Promise.all([
            Customer.findByPk(customerId, { transaction: t }),
            User.findOne({ where: { id: collectorId, roleId: COLLECTOR }, transaction: t }),
            User.findOne({ where: { id: managerId, roleId: MANAGER }, transaction: t })
        ]);
        if (!customer) return rollbackAndReturn(404, 'Customer not found');
        if (!collector) return rollbackAndReturn(404, 'Collector not found');
        if (!manager) return rollbackAndReturn(404, 'Manager not found');

        const loanNumber: string = generateRandomCode('LN'); // Generate Loan Number

        const endDate: Date = calculateDueDate(startDate, tenureMonths); // Calculate Loan End Date

        // create a new loan
        const loan: Loan = await Loan.create({
            customerId,
            collectorId,
            createdBy: managerId,
            loanNumber,
            loanAmount,
            interestRate,
            tenureMonths,
            processingFee,
            startDate,
            endDate,
            notes
        }, { transaction: t });

        if (Number(processingFee) > 0) {
            // create admin income record
            await Income.create({
                category: 'Loan Processing Fee',
                createdBy: managerId,
                source: `Loan #${loanNumber} for Customer #${customerId}`,
                amount: processingFee,
                remarks: 'Income generated from loan creation'
            }, { transaction: t });
        }

        await t.commit();
        successResponse(res, 201, 'Loan created successful', loan);
    } catch (error: any) {
        await t.rollback();
        catchResponse(res, 'Error creating the loan', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get all Loan
export const getAllLoan = async (req: Request, res: Response): Promise<any> => {
    const { id: userId, roleId: role } = (req as any).user;
    const { page, pageSize, search, sortField, sortOrder, status, fromDate, toDate } = req.query;
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
                { loanNumber: { [Op.like]: `%${searchTerm}%` } }
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
            model: Loan,
            page: pageNum,
            pageSize: size,
            whereClause,
            searchQuery: searchTerm,
            searchFields: [
                'loanNumber',
                'customers.first_name',
                'customers.last_name',
                'customers.email',
                'collectors.full_name',
                'created_by.full_name',
                'updated_by.full_name',
                'approved_by.full_name',
                'rejected_by.full_name',
                'closed_by.full_name'
            ],
            sortField: sortFieldStr,
            sortOrder: sortOrderStr as 'ASC' | 'DESC',
            options: {
                include: [
                    {
                        model: Customer,
                        as: 'customers',
                        attributes: ['id', 'createdBy', 'firstName', 'lastName', 'email', 'phone', 'isActive'],
                        include: [
                            {
                                model: CustomerDocuments,
                                as: 'customer_documents',
                                attributes: ['id', 'customerId', 'verificationStatus']
                            }
                        ]
                    },
                    { model: User, as: 'collectors', attributes: ['id', 'roleId', 'fullName'] },
                    { model: User, as: 'created_by', attributes: ['id', 'roleId', 'fullName'] },
                    { model: User, as: 'updated_by', attributes: ['id', 'roleId', 'fullName'] },
                    { model: User, as: 'approved_by', attributes: ['id', 'roleId', 'fullName'] },
                    { model: User, as: 'rejected_by', attributes: ['id', 'roleId', 'fullName'] },
                    { model: User, as: 'closed_by', attributes: ['id', 'roleId', 'fullName'] }
                ]
            }
        });

        successResponse(res, 200, 'Loans fetched successfully', result);
    } catch (error: any) {
        catchResponse(res, 'Error fetching loans', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get Loan by ID
export const getLoanById = async (req: Request, res: Response): Promise<any> => {
    const loanId = Number(req.params.id);
    try {
        const loan: Loan | null = await Loan.findByPk(loanId, {
            include: [
                {
                    model: Customer,
                    as: 'customers',
                    include: [{ model: CustomerDocuments, as: 'customer_documents' }]
                },
                { model: User, as: 'collectors', attributes: ['id', 'roleId', 'fullName'] },
                { model: User, as: 'created_by', attributes: ['id', 'roleId', 'fullName'] }
            ]
        });
        if (!loan) return errorResponse(res, 404, 'Loan not found');
        successResponse(res, 200, 'Loan fetched successfully', loan);
    } catch (error: any) {
        catchResponse(res, 'Error fetching loan details', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Update Loan by ID
export const updateLoan = async (req: Request, res: Response): Promise<any> => {
    const loanId = Number(req.params.id);
    const managerId = (req as any).user.id;
    const { collectorId, interestRate, tenureMonths, disbursedAmount, startDate, status, notes, rejectionReason } = req.body;

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

        const loan: Loan | null = await Loan.findByPk(loanId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!loan) return rollbackAndReturn(404, 'Loan not found');

        const manager: User | null = await User.findOne({ where: { id: managerId, roleId: MANAGER }, transaction: t });
        if (!manager) return rollbackAndReturn(404, 'Manager not found');

        let updatedLoan: Loan | null = loan;
        const today: Date = new Date();

        const commitAndReturn = async (message: string, data: any) => {
            await t.commit();
            return successResponse(res, 200, message, data);
        };

        // APPROVE
        if (status === 'approved') {
            if (loan.status !== 'pending') return rollbackAndReturn(400, 'Only pending loans can be approved');
            updatedLoan = await loan.update({ approvedBy: managerId, status: 'approved', approvedAt: today }, { transaction: t });
            return commitAndReturn('Loan approved successfully', updatedLoan);
        }

        // REJECT
        else if (status === 'rejected') {
            if (loan.status !== 'pending') return rollbackAndReturn(400, 'Only pending loans can be rejected');
            updatedLoan = await loan.update({ rejectedBy: managerId, status: 'rejected', rejectedAt: today, rejectionReason }, { transaction: t });
            return commitAndReturn('Loan rejected successfully', updatedLoan);
        }

        // ACTIVATE
        else if (status === 'active') {
            if (loan.status !== 'approved') return rollbackAndReturn(400, 'Loan must be approved first');
            updatedLoan = await loan.update({ status: 'active', disbursedAmount, disbursedAt: today }, { transaction: t });
            await generateEmiSchedule(updatedLoan, t);
            return commitAndReturn('Loan activated successfully', updatedLoan);
        }

        // CLOSE
        else if (status === 'closed') {
            if (loan.status !== 'active') return rollbackAndReturn(400, 'Only active loans can be closed');

            const emiCount = await EmiSchedule.count({
                where: {
                    loanId,
                    status: { [Op.in]: ['pending', 'partial'] },
                    balanceAmount: { [Op.gt]: 0 }
                },
                transaction: t
            });
            if (emiCount > 0) return rollbackAndReturn(400, 'Loan cannot be closed. Some EMIs are still pending');

            updatedLoan = await loan.update({ status: 'closed', closedBy: managerId, closedAt: today }, { transaction: t });
            return commitAndReturn('Loan closed successfully', updatedLoan);
        }

        // UPDATE
        else {
            const endDate: Date = calculateDueDate(startDate, tenureMonths); // Calculate Loan End Date
            updatedLoan = await loan.update({ collectorId, updatedBy: managerId, interestRate, tenureMonths, status, notes, startDate, endDate }, { transaction: t });
            return commitAndReturn('Loan updated successfully', updatedLoan);
        }
    } catch (error: any) {
        await t.rollback();
        catchResponse(res, 'Error updating loan', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Generates the EMI schedule for a loan
async function generateEmiSchedule(loan: Loan, t: any) {
    if (!loan.disbursedAmount) throw new Error('Loan must be disbursed first');

    const principalAmount: number = Number(loan.disbursedAmount || loan.loanAmount);

    // calculate emi amounts
    const { monthlyPrincipal, monthlyInterest, emiAmount } = calculateEMIBorrowingAmounts(principalAmount, loan.interestRate, loan.tenureMonths);

    const emis = [];

    for (let i = 1; i <= loan.tenureMonths; i++) {
        const dueDate: Date = calculateDueDate(loan.startDate, i); // Calculate Loan Due Date

        emis.push({
            loanId: loan.id,
            installmentNo: i,
            emiScheduleAmount: emiAmount,
            principalAmount: monthlyPrincipal,
            interestAmount: monthlyInterest,
            paidAmount: 0,
            balanceAmount: emiAmount,
            dueDate
        });
    }

    await EmiSchedule.bulkCreate(emis, { transaction: t });
};

// Delete Loan by ID
export const deleteLoan = async (req: Request, res: Response): Promise<any> => {
    const loanId = Number(req.params.id);
    try {
        const loan: Loan | null = await Loan.findByPk(loanId);
        if (!loan) return errorResponse(res, 404, 'Loan not found');

        await Loan.destroy({ where: { id: loanId } });
        successResponse(res, 200, 'Loan deleted successfully', null);
    } catch (error: any) {
        catchResponse(res, 'Error deleting loan', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};