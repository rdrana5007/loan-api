import { ADMIN, COLLECTOR, MANAGER } from "../constants";
import { removeFile } from "./file.util";
import crypto from 'crypto';

const API_SUCCESS = true;
const API_ERROR = false;
const ERROR_STATUS_CODE = 500;
const ERROR_MESSAGE = 'Internal server error';

// Success Response
export const successResponse = (res: any, statusCode: number, message: string = '', data: any) => {
    return res.status(statusCode).json({ success: API_SUCCESS, message, data });
};

// Error Response
export const errorResponse = (res: any, statusCode: number, message: string = '', error: any = null) => {
    return res?.status(statusCode).json({ message, error });
};

// Catch Response
export const catchResponse = (res: any, message: string = ERROR_MESSAGE, error: any) => {
    return res?.status(ERROR_STATUS_CODE).json({ success: API_ERROR, message, error });
};

// get role name
export const getRole = (roleId: number | null | undefined): string => {
    return roleId === ADMIN ? 'Admin' : roleId === MANAGER ? 'Manager' : roleId === COLLECTOR ? 'Collector' : 'User';

};

// remove uploaded files
export const removeUploadedFiles = async (...files: (string | null | undefined)[]): Promise<void> => {
    await Promise.all(files.filter(Boolean).map(file => removeFile(file as string)));
};

// generate random code
export const generateRandomCode = (prefixCode: string): string => {
    // Generate a random 4-digit number
    const randomNumber = Math.floor(Math.random() * 9000) + 1000;

    // Generate a random 4-character alphanumeric string
    const randomString = crypto.randomBytes(2).toString('hex').toUpperCase().slice(0, 4);

    // Combine prefix, random number, and random alphanumeric string
    return `${prefixCode}${randomNumber}${randomString}`;
};

// calculate loan endDate
export const calculateLoanEndDate = (startDate: string | Date, tenureMonths: number): Date => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + tenureMonths);
    return date;
};