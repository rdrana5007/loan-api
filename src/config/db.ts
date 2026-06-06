import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const { DB_DATABASE, DB_USER, DB_PASSWORD, DB_PORT, DB_HOST = 'localhost' } = process.env;

if (!DB_DATABASE || !DB_USER || !DB_PASSWORD || !DB_PORT) {
    throw new Error('Missing required database environment variables.');
}

export const sequelize = new Sequelize(DB_DATABASE, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    dialect: 'mysql',
    logging: false,
    port: Number(DB_PORT)
});

const connectDB = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully');

        // sync all imported models
        await sequelize.sync({ alter: false }); // safer than force true
        console.log('All models synced with the database');
    } catch (error) {
        console.log('Unable to connect to the database:', (error as Error).message);
        process.exit(1);
    }
};

export default connectDB;