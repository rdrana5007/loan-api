import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { catchResponse, errorResponse } from "../utils";

// Create emi followup schema
export const createEmiFollowupSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            emiScheduleId: Joi.number().integer().positive().required(),
            loanId: Joi.number().integer().positive().required(),
            customerId: Joi.number().integer().positive().required(),
            communicationType: Joi.string().valid('call', 'visit', 'sms', 'email', 'whatsapp').default('call'),
            status: Joi.string().valid('pending', 'completed').default('pending'),
            remarks: Joi.string().max(1000).required(),
            followUpDate: Joi.date().iso().required(),
            nextFollowupDate: Joi.date().iso().optional()
        });

        const { error } = schema.validate(req.body);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating emi followup creation', error);
    }
};

// Update emi followup by id schema
export const updateEmiFollowupSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            status: Joi.string().valid('pending', 'completed').required(),
            remarks: Joi.string().max(1000).optional(),
            followUpDate: Joi.date().iso().optional(),
            nextFollowupDate: Joi.date().iso().optional()
        }).min(1);

        const { error } = schema.validate(req.body);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating update emi followup', error);
    }
};