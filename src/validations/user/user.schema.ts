import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { catchResponse, errorResponse } from "../../utils";

// Create user schema
export const createUserSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            userName: Joi.string().min(3).max(30).required(),
            fullName: Joi.string().min(3).max(30).required(),
            email: Joi.string().email().required().messages({
                'string.empty': 'Email is required.',
                'string.email': 'Please enter a valid Email id.',
                'any.required': 'Email is required.'
            }),
            phone: Joi.string().pattern(/^[0-9]{7,15}$/).required().messages({
                'string.pattern.base': 'Phone number must be between 7 and 15 digits and contain only numbers.',
                'any.required': 'Phone number is required.'
            }),
            password: Joi.string()
                .min(6)
                .max(12)
                .pattern(new RegExp(/^(?=^[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?][0-9]).{6,12}$/))
                .required()
                .messages({
                    'string.pattern.base': 'Password must be 6-12 characters, start with an uppercase letter, contain a special character followed by a number.',
                    'string.min': 'Password must be at least 6 characters long.',
                    'string.max': 'Password must be at most 12 characters long.',
                    'any.required': 'Password is required.'
                }),
            roleId: Joi.number().optional(),
            isActive: Joi.boolean().optional()
        });

        const { error } = schema.validate(req.body);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating user creation', error);
    }
};

// Get all user schema
export const getAllUserSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            page: Joi.number().integer().min(1).optional(),
            pageSize: Joi.number().integer().min(1).max(100).optional(),
            search: Joi.string().max(100).optional(),
            sortField: Joi.string().valid('userName', 'email', 'createdAt', 'updatedAt').optional(),
            sortOrder: Joi.string().valid('asc', 'desc').optional(),
            isManager: Joi.boolean().optional(),
            isCollector: Joi.boolean().optional()
        });

        const { error } = schema.validate(req.query);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating get all users', error);
    }
};

// Update user by id schema
export const updateUserSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            userName: Joi.string().min(3).max(30).optional(),
            fullName: Joi.string().min(3).max(30).optional(),
            email: Joi.string().email().optional(),
            phone: Joi.string().pattern(/^[0-9]{7,15}$/).optional().messages({
                'string.pattern.base': 'Phone number must be between 7 and 15 digits and contain only numbers.',
                'any.required': 'Phone number is required.'
            }),
            isActive: Joi.boolean().optional()
        }).min(1);

        const { error } = schema.validate(req.body);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating update user', error);
    }
};