import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { catchResponse, errorResponse } from "../../utils";

// Create borrowing schema
export const createBorrowingSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            counterpartyId: Joi.number().integer().positive().required(),
            principalAmount: Joi.number().positive().precision(2).required(),
            interestRate: Joi.number().min(0).max(100).precision(2).required(),
            tenureMonths: Joi.number().integer().positive().required(),
            status: Joi.string().valid('pending', 'approved', 'rejected', 'active', 'closed', 'defaulted').default('pending'),
            startDate: Joi.date().iso().required()
        });

        const { error } = schema.validate(req.body);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating borrowing creation', error);
    }
};

// Get all borrowing schema
export const getAllBorrowingSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).optional(),
            pageSize: Joi.number().integer().min(1).max(100).optional(),
            search: Joi.string().max(100).optional(),
            sortField: Joi.string().valid('createdAt', 'updatedAt').optional(),
            sortOrder: Joi.string().valid('asc', 'desc').optional(),
            status: Joi.string().valid('pending', 'approved', 'rejected', 'active', 'closed', 'defaulted').optional(),
            fromDate: Joi.date().optional(),
            toDate: Joi.date().optional()
        });

        const { error } = schema.validate(req.query);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating get all borrowings', error);
    }
};

// Update borrowing by id schema
export const updateBorrowingSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            counterpartyId: Joi.number().integer().positive().optional(),
            principalAmount: Joi.number().positive().precision(2).optional(),
            interestRate: Joi.number().min(0).max(100).precision(2).optional(),
            tenureMonths: Joi.number().integer().positive().optional(),
            status: Joi.string().valid('pending', 'approved', 'rejected', 'active', 'closed', 'defaulted').optional(),
            startDate: Joi.date().iso().optional()
        }).min(1);

        const { error } = schema.validate(req.body);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating update borrowing', error);
    }
};