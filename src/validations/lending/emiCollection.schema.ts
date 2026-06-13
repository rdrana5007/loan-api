import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { catchResponse, errorResponse } from "../../utils";

// Create emi collection schema
export const createEmiCollectionSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            emiScheduleId: Joi.number().integer().positive().required(),
            customerId: Joi.number().integer().positive().required(),
            collectedAmount: Joi.number().positive().precision(2).min(0).required(),
            paymentMethod: Joi.string().valid('cash', 'upi', 'bank', 'cheque').default('cash'),
            transactionReference: Joi.string().max(128).required(),
            remarks: Joi.string().max(1000).allow('', null).optional()
        });

        const { error } = schema.validate(req.body);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating emi collection creation', error);
    }
};

// Get all emi collection schema
export const getAllEmiCollectionSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).optional(),
            pageSize: Joi.number().integer().min(1).max(100).optional(),
            search: Joi.string().max(100).optional(),
            sortField: Joi.string().valid('createdAt', 'updatedAt').optional(),
            sortOrder: Joi.string().valid('asc', 'desc').optional(),
            paymentMethod: Joi.string().valid('cash', 'upi', 'bank', 'cheque').optional()
        });

        const { error } = schema.validate(req.query);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating get all emi collections', error);
    }
};