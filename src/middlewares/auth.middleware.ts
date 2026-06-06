import { NextFunction, Request, Response } from "express";
import { catchResponse, errorResponse, verifyToken } from "../utils";
import { ADMIN, COLLECTOR, MANAGER } from "../constants";

// Middleware to authenticate requests using JWT
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse(res, 401, 'No token provided');
    }

    const token: string = authHeader?.split(' ')[1];
    if (!token) return errorResponse(res, 401, 'Unauthorized');

    try {
        const decoded: any = verifyToken(token);
        (req as any).user = decoded;
        next();
    } catch (error) {
        return catchResponse(res, 'Invalid token', error);
    }
};

// Middleware to restrict access to users
const authorizeRoles = (...allowedRoles: number[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            return errorResponse(res, 401, 'No token provided');
        }

        const token = authHeader.split(' ')[1];
        if (!token) return errorResponse(res, 401, 'Unauthorized');

        try {
            const decoded: any = verifyToken(token);
            (req as any).user = decoded;

            if (decoded && allowedRoles.includes(decoded?.roleId)) {
                return next();
            }
            return errorResponse(res, 403, 'Unauthorized !!!');
        } catch (error) {
            return catchResponse(res, 'Invalid token', error);
        }
    };
};

// Specific role-based middleware
export const isManager = authorizeRoles(ADMIN, MANAGER);
export const isCollector = authorizeRoles(ADMIN, MANAGER, COLLECTOR);