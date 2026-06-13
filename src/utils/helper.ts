import { col, fn, WhereOptions } from "sequelize";
import { ADMIN, COLLECTOR, MANAGER } from "../constants";
import { removeFile } from "./file.util";
import crypto, { randomUUID } from 'crypto';

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

// calculate loan due date
export const calculateDueDate = (startDate: string | Date, tenureMonths: number): Date => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + tenureMonths);
    return date;
};

// generate counterparty code
export const generateCounterpartyCode = (): string => {
    return `CP-${randomUUID().slice(0, 8).toUpperCase()}`
};

// calculate emi borrowing amounts
export const calculateEMIBorrowingAmounts = (principalAmount: number, interestRate: number, tenureMonths: number) => {
    const principal: number = Number(principalAmount);
    const rate: number = Number(interestRate);

    const totalInterest: number = +(principal * rate / 100).toFixed(2);
    const totalPayable: number = +(principal + totalInterest).toFixed(2);

    const monthlyPrincipal: number = +(principal / tenureMonths).toFixed(2);
    const monthlyInterest: number = +(totalInterest / tenureMonths).toFixed(2);

    const emiAmount: number = +(monthlyPrincipal + monthlyInterest).toFixed(2);

    return { principal, totalInterest, totalPayable, monthlyPrincipal, monthlyInterest, emiAmount };
};

// get status counts
export const getStatusCounts = async (Model: any, allStatuses: string[], dateFilter?: WhereOptions) => {
    const statusCounts = await Model.findAll({
        attributes: [
            'status',
            [fn('COUNT', col('id')), 'count']
        ],
        where: dateFilter ? { ...dateFilter } : undefined,
        group: ['status'],
        raw: true
    });

    const map = new Map(statusCounts.map((i: any) => [i.status, Number(i.count)]));

    return allStatuses.map(status => ({
        status,
        count: map.get(status) || 0
    }));
};

// format month
const formatMonth = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

// get last 6 months date
export const getLast6Months = (): string[] => {
    const months: string[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(formatMonth(d));
    }

    return months;
};

// convert array to month format data
export const arrayToMonthMap = (data: any[]): Record<string, number> =>
    data.reduce((acc: Record<string, number>, { month, total }: any) => {
        acc[month] = Number(total);
        return acc;
    }, {});

// get the start date for dashboard period filters
export const getDateRange = (period: string) => {
    const startDate = new Date();

    switch (period) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;

        case 'last_week':
            startDate.setDate(startDate.getDate() - 7);
            break;

        case 'last_15_days':
            startDate.setDate(startDate.getDate() - 15);
            break;

        case 'last_month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;

        case 'last_3_months':
            startDate.setMonth(startDate.getMonth() - 3);
            break;

        case 'last_6_months':
            startDate.setMonth(startDate.getMonth() - 6);
            break;

        case 'last_year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;

        default:
            startDate.setMonth(startDate.getMonth() - 1);
    }

    return startDate;
};