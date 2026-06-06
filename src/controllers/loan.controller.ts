import { Request, Response } from "express";
import { Customer, CustomerDocuments, EmiSchedule, Loan, User } from "../models";
import { calculateLoanEndDate, catchResponse, errorResponse, generateRandomCode, paginate, successResponse } from "../utils";
import { Op } from "sequelize";
import { COLLECTOR, MANAGER } from "../constants";

// Create Loan
export const createLoan = async (req: Request, res: Response): Promise<any> => {
    const managerId = (req as any).user.id;
    const { customerId, collectorId, loanAmount, interestRate, tenureMonths, processingFee, startDate, notes } = req.body;

    try {
        const [customer, collector, manager]: [Customer | null, User | null, User | null] = await Promise.all([
            Customer.findByPk(customerId),
            User.findOne({ where: { id: collectorId, roleId: COLLECTOR } }),
            User.findOne({ where: { id: managerId, roleId: MANAGER } })
        ]);
        if (!customer) return errorResponse(res, 404, 'Customer not found');
        if (!collector) return errorResponse(res, 404, 'Collector not found');
        if (!manager) return errorResponse(res, 404, 'Manager not found');

        const loanNumber: string = generateRandomCode('LN'); // Generate Loan Number

        const endDate: Date = calculateLoanEndDate(startDate, tenureMonths); // Calculate Loan EndDate

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
        });

        successResponse(res, 201, 'Loan created successful', loan);
    } catch (error: any) {
        catchResponse(res, 'Error creating the loan', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get all Loan
export const getAllLoan = async (req: Request, res: Response): Promise<any> => {
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
                        required: true,
                        attributes: ['id', 'roleId', 'createdBy', 'firstName', 'lastName', 'email', 'phone', 'isActive'],
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
                    required: true,
                    attributes: { exclude: ['password'] },
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

    try {
        const [loan, manager]: [Loan | null, User | null] = await Promise.all([
            Loan.findByPk(loanId),
            User.findOne({ where: { id: managerId, roleId: MANAGER } })
        ]);
        if (!loan) return errorResponse(res, 404, 'Loan not found');
        if (!manager) return errorResponse(res, 404, 'Manager not found');

        if (status === 'approved') {
            if (loan.status !== 'pending') {
                return errorResponse(res, 400, 'Only pending loans can be approved');
            }
            await loan.update({ approvedBy: managerId, status: 'approved', approvedAt: new Date() });
            return successResponse(res, 200, 'Loan approved successfully', loan);
        }
        if (status === 'rejected') {
            if (loan.status !== 'pending') {
                return errorResponse(res, 400, 'Only pending loans can be rejected');
            }
            await loan.update({ rejectedBy: managerId, status: 'rejected', rejectedAt: new Date(), rejectionReason });
            return successResponse(res, 200, 'Loan rejected successfully', loan);
        }
        if (status === 'active') {
            if (loan.status !== 'approved') {
                return errorResponse(res, 400, 'Loan must be approved first');
            }
            await loan.update({ status: 'active', disbursedAmount, disbursedAt: new Date() });
            await generateEmiSchedule(loan);
            return successResponse(res, 200, 'Loan active successfully', loan);
        }
        if (status === 'closed') {
            if (loan.status !== 'active') {
                return errorResponse(res, 400, 'Only active loans can be closed');
            }

            // Fetch all EMI schedules for this loan
            const emiSchedules = await EmiSchedule.findAll({ where: { loanId } });

            // Check if all EMIs are fully paid
            const hasPendingEmi = emiSchedules.some(emi => Number(emi.balanceAmount) > 0);
            if (hasPendingEmi) return errorResponse(res, 400, 'Loan cannot be closed. Some EMIs are still pending');

            await loan.update({ status: 'closed', closedBy: managerId, closedAt: new Date() });
            return successResponse(res, 200, 'Loan closed successfully', loan);
        }

        const endDate: Date = calculateLoanEndDate(startDate, tenureMonths); // Calculate Loan EndDate

        await loan.update({ collectorId, updatedBy: managerId, interestRate, tenureMonths, status, notes, startDate, endDate });
        successResponse(res, 200, 'Loan updated successfully', loan);
    } catch (error: any) {
        catchResponse(res, 'Error updating loan', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

async function generateEmiSchedule(loan: Loan) {
    if (!loan.disbursedAmount) throw new Error('Loan must be disbursed first');

    const principalBase = Number(loan.disbursedAmount || loan.loanAmount);
    const monthlyPrincipal = principalBase / loan.tenureMonths;
    const monthlyInterest = (principalBase * Number(loan.interestRate) / 100) / loan.tenureMonths;

    for (let i = 1; i <= loan.tenureMonths; i++) {
        const dueDate: Date = calculateLoanEndDate(loan.startDate, i); // Calculate Loan DueDate
        const emiAmount = monthlyPrincipal + monthlyInterest;

        await EmiSchedule.create({
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