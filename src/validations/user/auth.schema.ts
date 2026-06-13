import Joi from "joi";
import { catchResponse, errorResponse } from "../../utils";
import { NextFunction, Request, Response } from "express";

// Login schema
export const loginSchema = (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required()
        });

        const { error } = schema.validate(req.body);
        if (error) return errorResponse(res, 400, error.details[0].message);

        next();
    } catch (error) {
        return catchResponse(res, 'Error validating login', error);
    }
};