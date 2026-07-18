import { Request, Response } from "express";
import { Customer, CustomerDocuments, EmiFollowup, EmiSchedule, Income, Loan, User } from "../../models";
import { calculateEMILoanAmounts, calculateLoanEndDate, calculateProcessingFee, catchResponse, errorResponse, generateRandomCode, paginate, successResponse } from "../../utils";
import { Op } from "sequelize";
import { COLLECTOR } from "../../constants";
import { sequelize } from "../../config";

// Create Loan
export const createLoan = async (req: Request, res: Response): Promise<any> => {
    const managerId = (req as any).user.id;
    const { customerId, collectorId, loanAmount, interestRate, processingFee, processingFeeType, installmentCount, repaymentFrequency, startDate, notes } = req.body;

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
            User.findOne({ where: { id: managerId }, transaction: t })
        ]);
        if (!customer) return rollbackAndReturn(404, 'Customer not found');
        if (!collector) return rollbackAndReturn(404, 'Collector not found');
        if (!manager) return rollbackAndReturn(404, 'Manager not found');

        const loanNumber: string = generateRandomCode('LN'); // Generate Loan Number
        
        const processingFeeAmount: number = calculateProcessingFee(Number(loanAmount), Number(processingFee), processingFeeType); // Calculate processing fee amount

        const endDate: Date = calculateLoanEndDate(startDate, installmentCount, repaymentFrequency);  // Calculate Loan End Date

        // create a new loan
        const loan: Loan = await Loan.create({
            customerId,
            collectorId,
            createdBy: managerId,
            loanNumber,
            loanAmount,
            interestRate,
            processingFee: processingFeeAmount,
            processingFeeType,
            installmentCount,
            repaymentFrequency,
            startDate,
            endDate,
            notes
        }, { transaction: t });

        if (Number(processingFeeAmount) > 0) {
            // create admin income record
            await Income.create({
                category: 'Loan Processing Fee',
                createdBy: managerId,
                source: `Loan #${loanNumber} for Customer #${customerId}`,
                amount: processingFeeAmount,
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
    const { page, pageSize, search, sortField, sortOrder, repaymentFrequency, status, fromDate, toDate } = req.query;
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

        if (repaymentFrequency) {
            whereClause.repaymentFrequency = repaymentFrequency;
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
                'customers.customer_code',
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
                        attributes: ['id', 'createdBy', 'customerCode', 'firstName', 'lastName', 'email', 'phone', 'isActive'],
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

// Get all Emi Schedule by Loan ID
export const getAllEmiSchedule = async (req: Request, res: Response): Promise<any> => {
    const loanId = Number(req.params.id);
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

        if (status) {
            whereClause.status = status;
        }

        const result = await paginate({
            model: EmiSchedule,
            page: pageNum,
            pageSize: size,
            whereClause,
            searchQuery: searchTerm,
            searchFields: [],
            sortField: sortFieldStr,
            sortOrder: sortOrderStr as 'ASC' | 'DESC',
            options: {
                include: [
                    { model: EmiFollowup, as: 'emi_followups', attributes: ['id', 'status'] }
                ]
            }
        });

        const loanDetail: any = {
            id: loan.id,
            customerId: loan.customerId,
            collectorId: loan.collectorId,
            createdBy: loan.createdBy,
            loanNumber: loan.loanNumber
        };

        successResponse(res, 200, 'Emi schedules fetched successfully', { loan: loanDetail, ...result });
    } catch (error: any) {
        catchResponse(res, 'Error fetching emi schedules', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get Loan by ID
export const getLoan = async (req: Request, res: Response): Promise<any> => {
    const loanId = Number(req.params.id);
    try {
        const loan: Loan | null = await Loan.findByPk(loanId, {
            include: [
                {
                    model: Customer,
                    as: 'customers',
                    attributes: ['id', 'createdBy', 'customerCode', 'firstName', 'lastName', 'email', 'phone', 'isActive'],
                    include: [
                        {
                            model: CustomerDocuments,
                            as: 'customer_documents',
                            attributes: ['id', 'customerId', 'verificationStatus']
                        }
                    ]
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
    const { collectorId, interestRate, installmentCount, repaymentFrequency, startDate, status, notes, rejectionReason } = req.body;

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

        const manager: User | null = await User.findOne({ where: { id: managerId }, transaction: t });
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

            const disbursedAmount: number = +(loan.loanAmount) - +(loan.processingFee);
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
            const endDate: Date = calculateLoanEndDate(startDate, installmentCount, repaymentFrequency);  // Calculate Loan End Date
            updatedLoan = await loan.update({ collectorId, updatedBy: managerId, interestRate, installmentCount, repaymentFrequency, status, notes, startDate, endDate }, { transaction: t });
            return commitAndReturn('Loan updated successfully', updatedLoan);
        }
    } catch (error: any) {
        await t.rollback();
        catchResponse(res, 'Error updating loan', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Generates the EMI schedule for a Loan
async function generateEmiSchedule(loan: Loan, t: any) {
    if (!loan.disbursedAmount) throw new Error('Loan must be disbursed first');

    const principalAmount: number = Number(loan.disbursedAmount || loan.loanAmount);

    // calculate emi amounts
    const { installmentPrincipal, installmentInterest, installmentAmount } = calculateEMILoanAmounts(principalAmount, loan.interestRate, loan.installmentCount);

    const emis = [];

    for (let i = 1; i <= loan.installmentCount; i++) {
        const dueDate: Date = calculateLoanEndDate(loan.startDate, i, loan.repaymentFrequency as 'daily' | 'weekly' | 'monthly');  // Calculate Loan Due Date

        emis.push({
            loanId: loan.id,
            installmentNo: i,
            emiScheduleAmount: installmentAmount,
            principalAmount: installmentPrincipal,
            interestAmount: installmentInterest,
            paidAmount: 0,
            balanceAmount: installmentAmount,
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

        const NON_DELETABLE_STATUSES = ['approved', 'active', 'defaulted'] as const;
        if (NON_DELETABLE_STATUSES.includes(loan.status as typeof NON_DELETABLE_STATUSES[number])) {
            return errorResponse(res, 400, `Loan with status '${loan.status}' cannot be deleted.`);
        }

        await Loan.destroy({ where: { id: loanId } });
        successResponse(res, 200, 'Loan deleted successfully', null);
    } catch (error: any) {
        catchResponse(res, 'Error deleting loan', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};