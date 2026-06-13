import { Request, Response } from "express";
import { catchResponse, errorResponse, generateCounterpartyCode, paginate, successResponse } from "../../utils";
import { Op } from "sequelize";
import { Counterparty, User } from "../../models";

// Create Counterparty
export const createCounterparty = async (req: Request, res: Response): Promise<any> => {
    const userId = (req as any).user.id;
    const { counterpartyType, name, companyName, email, phone, panNumber, gstNumber, address, bankName, accountNumber, ifscCode } = req.body;

    try {
        // check duplicate phone
        const existingPhone: Counterparty | null = await Counterparty.findOne({ where: { phone } });
        if (existingPhone) return errorResponse(res, 400, 'Counterparty already exists with this mobile number');

        // Check duplicate email & PAN
        const [existingEmail, existingPan]: [Counterparty | null, Counterparty | null] = await Promise.all([
            email ? Counterparty.findOne({ where: { email } }) : null,
            panNumber ? Counterparty.findOne({ where: { panNumber } }) : null
        ]);
        if (existingEmail) return errorResponse(res, 400, 'Email already exists');
        if (existingPan) return errorResponse(res, 400, 'PAN number already exists');

        const counterpartyCode: string = generateCounterpartyCode(); // Generate Counterparty Code

        // create a new counterparty
        const counterparty: Counterparty = await Counterparty.create({
            counterpartyCode,
            counterpartyType,
            name,
            companyName,
            email,
            phone,
            panNumber,
            gstNumber,
            address,
            bankName,
            accountNumber,
            ifscCode,
            createdBy: userId
        });

        successResponse(res, 201, 'Counterparty created successful', counterparty);
    } catch (error: any) {
        console.log('e', error)
        catchResponse(res, 'Error creating the counterparty', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get all Counterparty
export const getAllCounterparty = async (req: Request, res: Response): Promise<any> => {
    const { page, pageSize, search, sortField, sortOrder, counterpartyType } = req.query;
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const size = pageSize ? parseInt(pageSize as string, 10) : 10;
    const searchTerm = search ? (search as string) : '';
    const sortFieldStr = sortField ? (sortField as string) : 'createdAt';
    const sortOrderStr = sortOrder ? (sortOrder as string).toUpperCase() : 'DESC';

    try {
        let whereClause: any = {};

        if (counterpartyType) {
            whereClause.counterpartyType = counterpartyType;
        }

        if (searchTerm) {
            whereClause = searchTerm
                ? {
                    ...whereClause,
                    [Op.or]: [
                        { counterpartyCode: { [Op.like]: `%${searchTerm}%` } },
                        { name: { [Op.like]: `%${searchTerm}%` } },
                        { companyName: { [Op.like]: `%${searchTerm}%` } },
                        { email: { [Op.like]: `%${searchTerm}%` } }
                    ]
                }
                : {};
        }

        const result = await paginate({
            model: Counterparty,
            page: pageNum,
            pageSize: size,
            whereClause,
            searchQuery: searchTerm,
            searchFields: ['counterpartyCode', 'name', 'companyName', 'email', 'created_by.full_name'],
            sortField: sortFieldStr,
            sortOrder: sortOrderStr as 'ASC' | 'DESC',
            options: { include: [{ model: User, as: 'created_by', attributes: ['id', 'roleId', 'fullName'] }] }
        });

        successResponse(res, 200, 'Counterparties fetched successfully', result);
    } catch (error: any) {
        catchResponse(res, 'Error fetching counterparties', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Update Counterparty by ID
export const updateCounterparty = async (req: Request, res: Response): Promise<any> => {
    const counterpartyId = Number(req.params.id);
    const { counterpartyType, name, companyName, email, phone, panNumber, gstNumber, address, bankName, accountNumber, ifscCode } = req.body;

    try {
        const counterparty: Counterparty | null = await Counterparty.findByPk(counterpartyId);
        if (!counterparty) return errorResponse(res, 404, 'Counterparty not found');

        // Check duplicate email, phone & PAN
        const [existingEmail, existingPhone, existingPan]: [Counterparty | null, Counterparty | null, Counterparty | null] = await Promise.all([
            email ? Counterparty.findOne({ where: { email, id: { [Op.ne]: counterpartyId } } }) : null,
            phone ? Counterparty.findOne({ where: { phone, id: { [Op.ne]: counterpartyId } } }) : null,
            panNumber ? Counterparty.findOne({ where: { panNumber, id: { [Op.ne]: counterpartyId } } }) : null
        ]);
        if (existingEmail) return errorResponse(res, 400, 'Email already exists');
        if (existingPhone) return errorResponse(res, 400, 'Phone already exists');
        if (existingPan) return errorResponse(res, 400, 'PAN number already exists');

        await counterparty.update({ counterpartyType, name, companyName, email, phone, panNumber, gstNumber, address, bankName, accountNumber, ifscCode });
        successResponse(res, 200, 'Counterparty updated successfully', counterparty);
    } catch (error: any) {
        catchResponse(res, 'Error updating counterparty', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Delete Counterparty by ID
export const deleteCounterparty = async (req: Request, res: Response): Promise<any> => {
    const counterpartyId = Number(req.params.id);
    try {
        const counterparty: Counterparty | null = await Counterparty.findByPk(counterpartyId);
        if (!counterparty) return errorResponse(res, 404, 'Counterparty not found');

        await Counterparty.destroy({ where: { id: counterpartyId } });
        successResponse(res, 200, 'Counterparty deleted successfully', null);
    } catch (error: any) {
        catchResponse(res, 'Error deleting counterparty', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};