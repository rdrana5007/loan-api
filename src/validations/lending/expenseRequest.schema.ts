import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { catchResponse, errorResponse } from "../../utils";

// Create expense request schema
export const createExpenseRequestSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            category: Joi.string().min(3).max(30).required(),
            description: Joi.string().max(1000).required(),
            amount: Joi.number().positive().precision(2).required(),
            status: Joi.string().valid('pending', 'approved', 'rejected').default('pending')
        });

        const { error } = schema.validate(req.body);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating expense creation', error);
    }
};

// Get all expense request schema
export const getAllExpenseRequestSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).optional(),
            pageSize: Joi.number().integer().min(1).max(100).optional(),
            search: Joi.string().max(100).optional(),
            sortField: Joi.string().valid('createdAt', 'updatedAt').optional(),
            sortOrder: Joi.string().valid('asc', 'desc').optional(),
            status: Joi.string().valid('pending', 'approved', 'rejected').optional()
        });

        const { error } = schema.validate(req.query);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating get all expenses', error);
    }
};

// Approve expense request by id schema
export const approveExpenseRequestSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            status: Joi.string().valid('approved', 'rejected').optional()
        }).min(1).unknown(false);

        const { error } = schema.validate(req.body);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating approve expense', error);
    }
};