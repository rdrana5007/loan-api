import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { catchResponse, errorResponse } from "../../utils";

// Create counterparty schema
export const createCounterpartySchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            counterpartyType: Joi.string().valid('investor', 'bank', 'NBFC', 'corporate', 'government').required(),
            name: Joi.string().min(3).max(30).required(),
            companyName: Joi.string().max(128).allow('' , null).optional(),
            email: Joi.string().email().allow('' , null).optional().messages({
                'string.email': 'Please enter a valid Email id.'
            }),
            phone: Joi.string().pattern(/^[0-9]{7,15}$/).required().messages({
                'string.pattern.base': 'Phone number must be between 7 and 15 digits and contain only numbers.',
                'any.required': 'Phone number is required.'
            }),
            panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).allow('', null).optional().messages({
                'string.pattern.base': 'Please enter a valid PAN number.'
            }),
            gstNumber: Joi.string().allow('', null).optional(),
            address: Joi.string().max(255).allow('' , null).optional(),
            bankName: Joi.string().max(100).allow('', null).optional(),
            accountNumber: Joi.string().max(30).allow('', null).optional(),
            ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).allow('', null).optional().messages({
                'string.pattern.base': 'Please enter a valid IFSC code.'
            }),
            isActive: Joi.boolean().optional()
        });

        const { error } = schema.validate(req.body);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating counterparty creation', error);
    }
};

// Get all counterparty schema
export const getAllCounterpartySchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).optional(),
            pageSize: Joi.number().integer().min(1).max(100).optional(),
            search: Joi.string().max(100).optional(),
            sortField: Joi.string().valid('name', 'companyName', 'createdAt', 'updatedAt').optional(),
            sortOrder: Joi.string().valid('asc', 'desc').optional(),
            counterpartyType: Joi.string().valid('investor', 'bank', 'NBFC', 'corporate', 'government').optional(),
            status: Joi.boolean().optional()
        });

        const { error } = schema.validate(req.query);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating get all counterparties', error);
    }
};

// Update counterparty by id schema
export const updateCounterpartySchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            counterpartyType: Joi.string().valid('investor', 'bank', 'NBFC', 'corporate', 'government').optional(),
            name: Joi.string().min(3).max(30).optional(),
            companyName: Joi.string().max(128).allow('' , null).optional(),
            email: Joi.string().email().allow('' , null).optional().messages({
                'string.email': 'Please enter a valid Email id.'
            }),
            phone: Joi.string().pattern(/^[0-9]{7,15}$/).optional().messages({
                'string.pattern.base': 'Phone number must be between 7 and 15 digits and contain only numbers.',
                'any.required': 'Phone number is required.'
            }),
            panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).allow('', null).optional().messages({
                'string.pattern.base': 'Please enter a valid PAN number.'
            }),
            gstNumber: Joi.string().allow('', null).optional(),
            address: Joi.string().max(255).allow('' , null).optional(),
            bankName: Joi.string().max(100).allow('', null).optional(),
            accountNumber: Joi.string().max(30).allow('', null).optional(),
            ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).allow('', null).optional().messages({
                'string.pattern.base': 'Please enter a valid IFSC code.'
            }),
            isActive: Joi.boolean().optional()
        }).min(1);

        const { error } = schema.validate(req.body);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating update counterparty', error);
    }
};