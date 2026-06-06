import { Request, Response } from "express";
import { catchResponse, errorResponse, successResponse } from "../utils";
import { Customer, EmiCollection, EmiSchedule, Loan, User } from "../models";
import { COLLECTOR } from "../constants";
import { sequelize } from "../config";

// Create Emi Collection
export const createEmiCollection = async (req: Request, res: Response): Promise<any> => {
    const collectorId = (req as any).user.id;
    const { emiScheduleId, customerId, collectedAmount, paymentMethod, transactionReference, remarks } = req.body;
    const t = await sequelize.transaction();

    try {
        const emi: EmiSchedule | null = await EmiSchedule.findByPk(emiScheduleId, {
            transaction: t,
            lock: t.LOCK.UPDATE
        });
        if (!emi) {
            await t.rollback();
            return errorResponse(res, 404, 'Emi not found');
        }

        const [customer, collector]: [Customer | null, User | null] = await Promise.all([
            Customer.findByPk(customerId, { transaction: t }),
            User.findOne({ where: { id: collectorId, roleId: COLLECTOR }, transaction: t })
        ]);
        if (!customer) {
            await t.rollback();
            return errorResponse(res, 404, 'Customer not found');
        }
        if (!collector) {
            await t.rollback();
            return errorResponse(res, 404, 'Collector not found');
        }

        // block invalid EMI
        if (emi.status === 'paid' || Number(emi.balanceAmount) <= 0) {
            await t.rollback();
            return errorResponse(res, 400, 'EMI already fully paid');
        }

        // block overpayment
        if (Number(collectedAmount) > Number(emi.balanceAmount)) {
            await t.rollback();
            return errorResponse(res, 400, 'Amount exceeds remaining balance');
        }

        // create a new emi collection
        const emiCollection: EmiCollection = await EmiCollection.create({
            emiScheduleId,
            customerId,
            collectorId,
            collectedAmount,
            paymentMethod,
            transactionReference,
            remarks
        }, { transaction: t });

        const paid = Number(emi.paidAmount) + Number(collectedAmount);
        const balance = Number(emi.emiScheduleAmount) - paid;

        emi.paidAmount = paid;
        emi.balanceAmount = balance;
        emi.status = balance <= 0 ? 'paid' : 'partial';
        if (balance <= 0) emi.paidDate = new Date();

        await emi.save({ transaction: t });
        await t.commit();

        successResponse(res, 201, 'Emi collection created successful', { emiCollection, emi });
    } catch (error: any) {
        await t.rollback();
        catchResponse(res, 'Error creating the emi collection', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};


// Auto scheduler function
export const autoScheduler = async () => {
    const today = new Date();

    // 1️⃣ Fetch active loans
    const activeLoans = await Loan.findAll({
        where: { status: 'active' }
    });

    for (const loan of activeLoans) {
        // 2️⃣ Fetch all EMIs for this loan
        const emis = await EmiSchedule.findAll({ where: { loanId: loan.id } });

        let overdueCount = 0;

        for (const emi of emis) {
            const balance = Number(emi.balanceAmount);

            if (balance === 0) {
                emi.status = 'paid';
            } else if (emi.dueDate < today) {
                emi.status = 'overdue';
                overdueCount++;
            } else {
                emi.status = 'pending';
            }

            await emi.save();
        }

        // 3️⃣ Check for loan default
        const defaultThreshold = 2; // e.g., default if 2+ EMIs overdue
        if (overdueCount >= defaultThreshold) {
            loan.status = 'defaulted';
            (loan as any).defaultedAt = today;
            await loan.save();
        }
    }

    console.log('Auto scheduler executed successfully');
};