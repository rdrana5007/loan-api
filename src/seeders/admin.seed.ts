import { Role, User } from "../models";
import { hashPassword } from "../utils";
import dotenv from 'dotenv';

dotenv.config();

const { ADMIN_USER_NAME, ADMIN_FULL_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_PHONE } = process.env;

// Create Admin
export const seedAdmin = async () => {
    const userName = ADMIN_USER_NAME || 'Admin123';
    const fullName = ADMIN_FULL_NAME || 'Admin';
    const email = ADMIN_EMAIL || 'admin@yopmail.com';
    const password = ADMIN_PASSWORD || 'Admin@123';
    const phone = ADMIN_PHONE || '1234567890';

    try {
        // check if user already exists
        const admin = await User.findOne({ where: { email: email }});
        if (admin) {
            console.log("Admin already exists");
            return;
        }

        // get role id
        const role = await Role.findOne({ where: { name: 'Admin' }});
        const roleId = role?.id as number;

        // hash the password
        const hashedPassword = await hashPassword(password);

        // create admin
        await User.create({
            userName,
            fullName,
            email,
            phone,
            password: hashedPassword,
            roleId,
            isActive: true
        });

        console.log('Admin created successfully');
    } catch (error) {
        console.error(error || 'Error seeding the admin');
    }
};