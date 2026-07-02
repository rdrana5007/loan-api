import { Request, Response } from "express";
import { Customer, CustomerDocuments, User } from "../../models";
import { catchResponse, errorResponse, generateUserCode, paginate, removeUploadedFiles, successResponse } from "../../utils";
import { Op } from "sequelize";
import { sequelize } from "../../config";

// Create Customer
export const createCustomer = async (req: Request, res: Response): Promise<any> => {
    const userId = (req as any).user.id;
    const { firstName, lastName, email, phone, gender, address, city, state, pincode, aadhaarNumber, panNumber, verificationStatus, remarks } = req.body;
    const profileImage = (req as any).profileUrl || null;
    const aadhaarImage = (req as any).aadhaarUrl || null;
    const panImage = (req as any).panUrl || null;

    const t = await sequelize.transaction();

    try {
        // check if customer exists
        const existingCustomer: Customer | null = await Customer.findOne({ where: { email }, transaction: t });
        if (existingCustomer) {
            await t.rollback();
            await removeUploadedFiles(profileImage, aadhaarImage, panImage);
            return errorResponse(res, 400, 'Customer already exists');
        }

        const customerCode: string = generateUserCode('CUST'); // Generate Customer Code

        // create a new customer
        const customer: Customer = await Customer.create({
            customerCode,
            firstName,
            lastName,
            email,
            phone,
            gender,
            address,
            city,
            state,
            pincode,
            profileImage,
            createdBy: userId
        }, { transaction: t });

        // create customer documents
        const documents: CustomerDocuments = await CustomerDocuments.create({
            customerId: customer.id,
            aadhaarNumber,
            panNumber,
            verificationStatus,
            remarks,
            aadhaarFile: aadhaarImage,
            panFile: panImage
        }, { transaction: t });

        await t.commit();
        successResponse(res, 201, 'Customer created successful', { customer, documents });
    } catch (error: any) {
        await t.rollback();
        await removeUploadedFiles(profileImage, aadhaarImage, panImage);
        catchResponse(res, 'Error creating the customer', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get all Customer
export const getAllCustomer = async (req: Request, res: Response): Promise<any> => {
    const { page, pageSize, search, sortField, sortOrder, status, verificationStatus } = req.query;
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const size = pageSize ? parseInt(pageSize as string, 10) : 10;
    const searchTerm = search ? (search as string) : '';
    const sortFieldStr = sortField ? (sortField as string) : 'createdAt';
    const sortOrderStr = sortOrder ? (sortOrder as string).toUpperCase() : 'DESC';

    try {
        let whereClause: any = {};

        if (status !== undefined) {
            whereClause.isActive = status === 'true';
        }

        if (searchTerm) {
            whereClause = searchTerm
                ? {
                    ...whereClause,
                    [Op.or]: [
                        { customerCode: { [Op.like]: `%${searchTerm}%` } },
                        { firstName: { [Op.like]: `%${searchTerm}%` } },
                        { lastName: { [Op.like]: `%${searchTerm}%` } },
                        { email: { [Op.like]: `%${searchTerm}%` } },
                        { address: { [Op.like]: `%${searchTerm}%` } },
                        { city: { [Op.like]: `%${searchTerm}%` } },
                        { state: { [Op.like]: `%${searchTerm}%` } }
                    ]
                }
                : {};
        }

        const customerDocumentsInclude: any = {
            model: CustomerDocuments,
            as: 'customer_documents',
            attributes: ['id', 'customerId', 'aadhaarNumber', 'panNumber', 'aadhaarFile', 'panFile', 'verificationStatus', 'remarks']
        };

        if (verificationStatus) {
            customerDocumentsInclude.where = { verificationStatus };
            customerDocumentsInclude.required = true;
        }

        const result = await paginate({
            model: Customer,
            page: pageNum,
            pageSize: size,
            whereClause,
            searchQuery: searchTerm,
            searchFields: ['customerCode', 'firstName', 'lastName', 'email', 'address', 'city', 'state', 'created_by.full_name'],
            sortField: sortFieldStr,
            sortOrder: sortOrderStr as 'ASC' | 'DESC',
            options: {
                include: [
                    customerDocumentsInclude,
                    {
                        model: User,
                        as: 'created_by',
                        attributes: ['id', 'roleId', 'fullName']
                    }
                ]
            }
        });

        successResponse(res, 200, 'Customers fetched successfully', result);
    } catch (error: any) {
        catchResponse(res, 'Error fetching customers', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get Customer by ID
export const getCustomer = async (req: Request, res: Response): Promise<any> => {
    const customerId = Number(req.params.id);
    try {
        const customer: Customer | null = await Customer.findByPk(customerId, {
            include: [
                {
                    model: CustomerDocuments,
                    as: 'customer_documents',
                    attributes: ['id', 'customerId', 'aadhaarNumber', 'panNumber', 'aadhaarFile', 'panFile', 'verificationStatus', 'remarks']
                },
                {
                    model: User,
                    as: 'created_by',
                    attributes: ['id', 'roleId', 'fullName']
                }
            ]
        });
        if (!customer) return errorResponse(res, 404, 'Customer not found');
        successResponse(res, 200, 'Customer fetched successfully', customer);
    } catch (error: any) {
        catchResponse(res, 'Error fetching customer details', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get all Customer Code
export const getAllCustomerCode = async (req: Request, res: Response): Promise<any> => {
    const { page, pageSize, search, sortField, sortOrder } = req.query;
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const size = pageSize ? parseInt(pageSize as string, 10) : 10;
    const searchTerm = search ? (search as string) : '';
    const sortFieldStr = sortField ? (sortField as string) : 'createdAt';
    const sortOrderStr = sortOrder ? (sortOrder as string).toUpperCase() : 'DESC';

    try {
        let whereClause: any = {};

        if (searchTerm) {
            whereClause = searchTerm
                ? {
                    ...whereClause,
                    [Op.or]: [
                        { customerCode: { [Op.like]: `%${searchTerm}%` } }
                    ]
                }
                : {};
        }

        const result = await paginate({
            model: Customer,
            page: pageNum,
            pageSize: size,
            whereClause,
            searchQuery: searchTerm,
            searchFields: ['customerCode'],
            sortField: sortFieldStr,
            sortOrder: sortOrderStr as 'ASC' | 'DESC',
            options: { attributes: ['id', 'customerCode'] }
        });

        successResponse(res, 200, 'Customers fetched successfully', result);
    } catch (error: any) {
        catchResponse(res, 'Error fetching customers', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Update Customer by ID
export const updateCustomer = async (req: Request, res: Response): Promise<any> => {
    const customerId = Number(req.params.id);
    const { firstName, lastName, email, phone, gender, address, city, state, pincode, aadhaarNumber, panNumber, verificationStatus, remarks, isActive } = req.body;
    const profileImage = (req as any).profileUrl || null;
    const aadhaarImage = (req as any).aadhaarUrl || null;
    const panImage = (req as any).panUrl || null;

    const t = await sequelize.transaction();

    try {
        const customer: Customer | null = await Customer.findByPk(customerId, { transaction: t });
        if (!customer) {
            await t.rollback();
            await removeUploadedFiles(profileImage, aadhaarImage, panImage);
            return errorResponse(res, 404, 'Customer not found');
        }

        let documents: CustomerDocuments | null = await CustomerDocuments.findOne({ where: { customerId }, transaction: t });

        if (email) {
            const existingCustomer: Customer | null = await Customer.findOne({
                where: { email, id: { [Op.ne]: customerId } },
                transaction: t
            });
            if (existingCustomer) {
                await t.rollback();
                await removeUploadedFiles(profileImage, aadhaarImage, panImage);
                return errorResponse(res, 400, 'Email already in use');
            }
        }

        const oldProfileImage: string | null | undefined = customer.profileImage;
        const oldAadhaarFile: string | null | undefined = documents?.aadhaarFile;
        const oldPanFile: string | null | undefined = documents?.panFile;

        if (profileImage && oldProfileImage) {
            await removeUploadedFiles(oldProfileImage);
        }
        if (aadhaarImage && oldAadhaarFile) {
            await removeUploadedFiles(oldAadhaarFile);
        }
        if (panImage && oldPanFile) {
            await removeUploadedFiles(oldPanFile);
        }

        await customer.update({
            firstName,
            lastName,
            email,
            phone,
            gender,
            address,
            city,
            state,
            pincode,
            profileImage: profileImage || oldProfileImage,
            isActive
        }, { transaction: t });

        if (documents) {
            // update customer documents
            await documents.update({
                aadhaarNumber,
                panNumber,
                verificationStatus,
                remarks,
                aadhaarFile: aadhaarImage || oldAadhaarFile,
                panFile: panImage || oldPanFile
            }, { transaction: t });
        } else {
            // create customer documents
            documents = await CustomerDocuments.create({
                customerId: customer.id,
                aadhaarNumber,
                panNumber,
                verificationStatus,
                remarks,
                aadhaarFile: aadhaarImage,
                panFile: panImage
            }, { transaction: t });
        }

        await t.commit();
        successResponse(res, 200, 'Customer updated successfully', { customer, documents });
    } catch (error: any) {
        await t.rollback();
        await removeUploadedFiles(profileImage, aadhaarImage, panImage);
        catchResponse(res, 'Error updating customer', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Delete Customer by ID
export const deleteCustomer = async (req: Request, res: Response): Promise<any> => {
    const customerId = Number(req.params.id);

    const t = await sequelize.transaction();

    try {
        const customer: Customer | null = await Customer.findByPk(customerId, { transaction: t });
        if (!customer) {
            await t.rollback();
            return errorResponse(res, 404, 'Customer not found');
        }

        // delete customer documents
        await CustomerDocuments.destroy({ where: { customerId }, transaction: t });

        // delete customer
        await Customer.destroy({ where: { id: customerId }, transaction: t });

        await t.commit();
        successResponse(res, 200, 'Customer deleted successfully', null);
    } catch (error: any) {
        await t.rollback();
        catchResponse(res, 'Error deleting customer', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};