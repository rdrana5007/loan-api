import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET || 'secret' as string;

// generate token
export const generateToken = (user: any): string => {
    const payload = { id: user.id, email: user.email, roleId: user.roleId };
    const options: SignOptions = { algorithm: 'HS256', expiresIn: '30d' as const };
    return jwt.sign(payload, secretKey, options);
};

// verify token
export const verifyToken = (token: string): JwtPayload | string => {
    return jwt.verify(token, secretKey);
};