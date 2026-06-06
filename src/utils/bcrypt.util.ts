import bcrypt from 'bcryptjs';

// hash a password
export const hashPassword = async (password: string): Promise<string> => {
    const salt = 10;
    return await bcrypt.hash(password, salt);
};

// compare a plain password with a hash password
export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};