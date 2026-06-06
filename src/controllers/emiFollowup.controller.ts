import { Request, Response } from "express";
import { catchResponse, errorResponse, successResponse } from "../utils";
import { Customer, EmiFollowUp, EmiSchedule, Loan, User } from "../models";
import { COLLECTOR } from "../constants";

// Create Emi Followup
export const createEmiFollowup = async (req: Request, res: Response): Promise<any> => {
    const collectorId = (req as any).user.id;
    const { emiScheduleId, loanId, customerId, communicationType, remarks, followUpDate, nextFollowupDate } = req.body;

    try {
        const [emi, loan, customer, collector]: [EmiSchedule | null, Loan | null, Customer | null, User | null] = await Promise.all([
            EmiSchedule.findByPk(emiScheduleId),
            Loan.findByPk(loanId),
            Customer.findByPk(customerId),
            User.findOne({ where: { id: collectorId, roleId: COLLECTOR } })
        ]);
        if (!emi) return errorResponse(res, 404, 'Emi not found');
        if (!loan) return errorResponse(res, 404, 'Loan not found');
        if (!customer) return errorResponse(res, 404, 'Customer not found');
        if (!collector) return errorResponse(res, 404, 'Collector not found');

        // create a new emi followup
        const emiFollowup: EmiFollowUp = await EmiFollowUp.create({
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

// Update Emi Followup by ID
export const updateEmiFollowup = async (req: Request, res: Response): Promise<any> => {
    const followupId = Number(req.params.id);
    const collectorId = (req as any).user.id;
    const { status, remarks, followUpDate, nextFollowupDate } = req.body;

    try {
        const [followup, collector]: [EmiFollowUp | null, User | null] = await Promise.all([
            EmiFollowUp.findByPk(followupId),
            User.findOne({ where: { id: collectorId, roleId: COLLECTOR } })
        ]);
        if (!followup) return errorResponse(res, 404, 'Emi followup not found');
        if (!collector) return errorResponse(res, 404, 'Collector not found');

        // check if this collector owns the followup
        if (followup.collectorId !== collectorId) {
            return errorResponse(res, 403, 'You are not authorized to complete this followup');
        }

        if (status === 'pending') {
            await followup.update({ remarks, followUpDate, nextFollowupDate });
        } else {
            await followup.update({ status, nextFollowupDate: null });
        }

        successResponse(res, 200, 'Emi followup updated successfully', followup);
    } catch (error: any) {
        catchResponse(res, 'Error updating emi followup', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};