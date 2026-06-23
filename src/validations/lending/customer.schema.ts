import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { catchResponse, errorResponse } from "../../utils";

// Create customer schema
export const createCustomerSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            firstName: Joi.string().min(3).max(30).required(),
            lastName: Joi.string().min(3).max(30).required(),
            email: Joi.string().email().required().messages({
                'string.empty': 'Email is required.',
                'string.email': 'Please enter a valid Email id.',
                'any.required': 'Email is required.'
            }),
            phone: Joi.string().pattern(/^[0-9]{7,15}$/).required().messages({
                'string.pattern.base': 'Phone number must be between 7 and 15 digits and contain only numbers.',
                'any.required': 'Phone number is required.'
            }),
            gender: Joi.string().valid('male', 'female', 'other').required(),
            address: Joi.string().max(255).required(),
            city: Joi.string().max(100).required(),
            state: Joi.string().max(100).required(),
            pincode: Joi.string().pattern(/^[0-9]{4,10}$/).required(),
            profileImage: Joi.string().allow('', null).optional(),
            aadhaarNumber: Joi.string().pattern(/^[0-9]{12}$/).optional(),
            panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional().messages({
                'string.pattern.base': 'Please enter a valid PAN number.'
            }),
            aadhaarFile: Joi.string().allow('', null).optional(),
            panFile: Joi.string().allow('', null).optional(),
            verificationStatus: Joi.string().valid('pending', 'verified', 'rejected').default('pending'),
            remarks: Joi.string().max(1000).allow('', null).optional(),
            isActive: Joi.boolean().optional()
        });

        const { error } = schema.validate(req.body);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating customer creation', error);
    }
};

// Get all customer schema
export const getAllCustomerSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).optional(),
            pageSize: Joi.number().integer().min(1).max(100).optional(),
            search: Joi.string().max(100).optional(),
            sortField: Joi.string().valid('firstName', 'lastName', 'email', 'createdAt', 'updatedAt').optional(),
            sortOrder: Joi.string().valid('asc', 'desc').optional(),
            status: Joi.boolean().optional(),
            verificationStatus: Joi.string().valid('pending', 'verified', 'rejected').optional()
        });

        const { error } = schema.validate(req.query);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating get all customers', error);
    }
};

// Update customer by id schema
export const updateCustomerSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            firstName: Joi.string().min(3).max(30).optional(),
            lastName: Joi.string().min(3).max(30).optional(),
            email: Joi.string().email().optional(),
            phone: Joi.string().pattern(/^[0-9]{7,15}$/).optional().messages({
                'string.pattern.base': 'Phone number must be between 7 and 15 digits and contain only numbers.',
                'any.required': 'Phone number is required.'
            }),
            gender: Joi.string().valid('male', 'female', 'other').optional(),
            address: Joi.string().max(255).optional(),
            city: Joi.string().max(100).optional(),
            state: Joi.string().max(100).optional(),
            pincode: Joi.string().pattern(/^[0-9]{4,10}$/).optional(),
            profileImage: Joi.string().allow('', null).optional(),
            aadhaarNumber: Joi.string().pattern(/^[0-9]{12}$/).optional(),
            panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional().messages({
                'string.pattern.base': 'Please enter a valid PAN number.'
            }),
            aadhaarFile: Joi.string().allow('', null).optional(),
            panFile: Joi.string().allow('', null).optional(),
            verificationStatus: Joi.string().valid('pending', 'verified', 'rejected').optional(),
            remarks: Joi.string().max(1000).allow('', null).optional(),
            isActive: Joi.boolean().optional()
        }).min(1);

        const { error } = schema.validate(req.body);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating update customer', error);
    }
};