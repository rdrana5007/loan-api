import { Request, Response } from "express";
import { Role, User } from "../models";
import { catchResponse, errorResponse, generateToken, getRole, hashPassword, paginate, successResponse } from "../utils";
import { Op } from "sequelize";
import { ADMIN, COLLECTOR, MANAGER } from "../constants";

// Create User (Manager / Collector)
export const createUser = async (req: Request, res: Response): Promise<any> => {
    const { userName, fullName, email, phone, password, roleId } = req.body;

    try {
        const roleName: string = getRole(roleId); // get role name

        // check if user exists
        const existingUser: User | null = await User.findOne({ where: { email } });
        if (existingUser) return errorResponse(res, 400, `${roleName} already exists`);

        const hashedPassword: string = await hashPassword(password); // hash the password

        // create a new user
        const user: User = await User.create({
            userName,
            fullName,
            email,
            phone,
            password: hashedPassword,
            roleId: roleId || null
        });

        const jwtToken: string = generateToken(user); // generate a token

        const newData: User | any = {
            id: user.id,
            userName: user.userName,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            roleId: user.roleId,
            isActive: user.isActive,
            signInProvider: user.signInProvider
        };

        successResponse(res, 201, `${roleName} created successful`, { token: jwtToken, user: newData });
    } catch (error: any) {
        catchResponse(res, 'Error creating the user', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get all User (Manager / Collector)
export const getAllUser = async (req: Request, res: Response): Promise<any> => {
    const { page, pageSize, search, sortField, sortOrder, isManager, isCollector } = req.query;
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const size = pageSize ? parseInt(pageSize as string, 10) : 10;
    const searchTerm = search ? (search as string) : '';
    const sortFieldStr = sortField ? (sortField as string) : 'createdAt';
    const sortOrderStr = sortOrder ? (sortOrder as string).toUpperCase() : 'DESC';

    try {
        let whereClause: any = {
            roleId: { [Op.ne]: ADMIN }
        };

        if (isManager || isCollector) {
            whereClause = { roleId: isManager ? MANAGER : COLLECTOR };
        }

        if (searchTerm) {
            whereClause = searchTerm
                ? {
                    [Op.or]: [
                        { userName: { [Op.like]: `%${searchTerm}%` } },
                        { fullName: { [Op.like]: `%${searchTerm}%` } },
                        { email: { [Op.like]: `%${searchTerm}%` } }
                    ]
                }
                : {};
        }

        const result = await paginate({
            model: User,
            page: pageNum,
            pageSize: size,
            whereClause,
            searchQuery: searchTerm,
            searchFields: ['userName', 'fullName', 'email'],
            sortField: sortFieldStr,
            sortOrder: sortOrderStr as 'ASC' | 'DESC',
            options: {
                attributes: { exclude: ['password'] },
                include: [{ model: Role, as: 'roles', attributes: ['id', 'name'] }]
            }
        });

        successResponse(res, 200, 'Users fetched successfully', result);
    } catch (error: any) {
        catchResponse(res, 'Error fetching users', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Update User (Manager / Collector) by ID
export const updateUser = async (req: Request, res: Response): Promise<any> => {
    const userId = Number(req.params.id);
    const { userName, fullName, email, phone } = req.body;

    try {
        const user: User | null = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });
        if (!user) return errorResponse(res, 404, 'User not found');

        if (email) {
            const existingUser: User | null = await User.findOne({
                where: { email, id: { [Op.ne]: userId } }
            });
            if (existingUser) return errorResponse(res, 400, 'Email already in use');
        }

        const roleName: string = getRole(user?.roleId); // get role name

        await user.update({ userName, fullName, email, phone });
        successResponse(res, 200, `${roleName} updated successfully`, user);
    } catch (error: any) {
        catchResponse(res, 'Error updating user', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Delete User (Manager / Collector) by ID
export const deleteUser = async (req: Request, res: Response): Promise<any> => {
    const userId = Number(req.params.id);
    try {
        const user: User | null = await User.findByPk(userId);
        if (!user) return errorResponse(res, 404, 'User not found');

        await User.destroy({ where: { id: userId } });
        successResponse(res, 200, 'User deleted successfully', null);
    } catch (error: any) {
        catchResponse(res, 'Error deleting user', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};