import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { catchResponse, errorResponse } from "../../utils";

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
            nextFollowupDate: Joi.date().iso().allow('', null).optional()
        });

        const { error } = schema.validate(req.body);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating emi followup creation', error);
    }
};

// Get all emi followup schema
export const getAllEmiFollowupSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).optional(),
            pageSize: Joi.number().integer().min(1).max(100).optional(),
            search: Joi.string().max(100).optional(),
            sortField: Joi.string().valid('createdAt', 'updatedAt').optional(),
            sortOrder: Joi.string().valid('asc', 'desc').optional(),
            status: Joi.string().valid('pending', 'completed').optional()
        });

        const { error } = schema.validate(req.query);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating get all emi followups', error);
    }
};

// Update emi followup by id schema
export const updateEmiFollowupSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            communicationType: Joi.string().valid('call', 'visit', 'sms', 'email', 'whatsapp').optional(),
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