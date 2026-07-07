import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { catchResponse, errorResponse } from "../../utils";

// Create loan schema
export const createLoanSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            customerId: Joi.number().integer().positive().required(),
            collectorId: Joi.number().integer().positive().required(),
            loanAmount: Joi.number().positive().precision(2).required(),
            interestRate: Joi.number().min(0).max(100).precision(2).required(),
            processingFee: Joi.number().min(0).precision(2).required(),
            processingFeeType: Joi.string().valid('flat', 'percentage').default('flat'),
            installmentCount: Joi.number().integer().positive().required(),
            repaymentFrequency: Joi.string().valid('daily', 'weekly', 'monthly').default('monthly'),
            status: Joi.string().valid('pending', 'approved', 'rejected', 'active', 'closed', 'defaulted').default('pending'),
            startDate: Joi.date().iso().required(),
            notes: Joi.string().max(2000).allow('', null).optional()
        });

        const { error } = schema.validate(req.body);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating loan creation', error);
    }
};

// Get all loan schema
export const getAllLoanSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).optional(),
            pageSize: Joi.number().integer().min(1).max(100).optional(),
            search: Joi.string().max(100).optional(),
            sortField: Joi.string().valid('createdAt', 'updatedAt').optional(),
            sortOrder: Joi.string().valid('asc', 'desc').optional(),
            repaymentFrequency: Joi.string().valid('daily', 'weekly', 'monthly').optional(),
            status: Joi.string().valid('pending', 'approved', 'rejected', 'active', 'closed', 'defaulted').optional(),
            fromDate: Joi.date().optional(),
            toDate: Joi.date().optional()
        });

        const { error } = schema.validate(req.query);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating get all loans', error);
    }
};

// Get loan by id schema
export const getLoanByIdSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            id: Joi.number().integer().positive().required()
        });

        const { error } = schema.validate(req.params);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating get loan', error);
    }
};

// Get all emi schedule by loan id schema
export const getAllEmiScheduleSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).optional(),
            pageSize: Joi.number().integer().min(1).max(100).optional(),
            search: Joi.string().max(100).optional(),
            sortField: Joi.string().valid('id', 'installmentNo', 'createdAt', 'updatedAt').optional(),
            sortOrder: Joi.string().valid('asc', 'desc').optional(),
            status: Joi.string().valid('pending', 'partial', 'paid', 'overdue').optional()
        });

        const { error } = schema.validate(req.query);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating get all emi schedules', error);
    }
};

// Update loan by id schema
export const updateLoanSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            collectorId: Joi.number().integer().positive().optional(),
            interestRate: Joi.number().min(0).max(100).precision(2).optional(),
            disbursedAmount: Joi.number().positive().precision(2).min(0).optional(),
            installmentCount: Joi.number().integer().positive().optional(),
            status: Joi.string().valid('pending', 'approved', 'rejected', 'active', 'closed', 'defaulted').optional(),
            startDate: Joi.date().iso().optional(),
            notes: Joi.string().max(2000).allow('', null).optional(),
            rejectionReason: Joi.string().max(100).allow('', null).optional(),
            defaultReason: Joi.string().max(100).allow('', null).optional()
        }).min(1);

        const { error } = schema.validate(req.body);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating update loan', error);
    }
};