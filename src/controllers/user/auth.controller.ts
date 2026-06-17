import { Request, Response } from "express";
import { Role, User } from "../../models";
import { catchResponse, comparePassword, errorResponse, generateToken, getRole, successResponse } from "../../utils";

// Login User
export const loginUser = async (req: Request, res: Response): Promise<any> => {
    const { email, password } = req.body;
    try {
        // check if user exists
        const user: User | null | any = await User.findOne({ where: { email } });
        if (!user) return errorResponse(res, 401, 'Invalid email or password. Please check your details and try again.');
        if (!user.isActive) return errorResponse(res, 403, 'Your account is inactive. Please contact support.');

        // handle social login users (Google / Apple)
        if (!user.password && ['google', 'apple'].includes(user.signInProvider)) {
            const signInProvider = user.signInProvider === 'google' ? 'Google' : 'Apple';
            return errorResponse(res, 409, `This email is linked to a ${signInProvider} account. Please use ${signInProvider} sign-in instead of a password login.`)
        }

        // compare password
        const isMatch: boolean = await comparePassword(password, user.password);
        if (!isMatch) return errorResponse(res, 401, 'Invalid email or password. Please check your details and try again.');

        const jwtToken = generateToken(user); // generate a token

        const roleName: string = getRole(user.roleId); // get role name

        const newData = {
            id: user.id,
            roleId: user.roleId,
            userName: user.userName,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            roleName,
            isActive: user.isActive,
            signInProvider: user.signInProvider
        };

        successResponse(res, 200, 'Login successful', { token: jwtToken, user: newData });
    } catch (error: any) {
        catchResponse(res, 'Error logging the user', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};

// Get User Profile
export const getUserProfile = async (req: Request, res: Response): Promise<any> => {
    const userId = (req as any).user.id;
    try {
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] },
            include: [{ model: Role, as: 'roles', attributes: ['id', 'name'] }]
        }) as User & { roles?: Role };
        if (!user) return errorResponse(res, 404, 'User not found');
        successResponse(res, 200, `${user?.roles?.name ?? 'User'} profile fetched successfully`, user);
    } catch (error: any) {
        catchResponse(res, 'Error fetching user profile', error?.errors?.[0]?.message || error.message || 'Unknown error');
    }
};