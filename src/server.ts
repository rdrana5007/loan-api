import express, { Application, Request, Response } from "express";
import dotenv from 'dotenv';
import bodyParser from "body-parser";
import cors from 'cors';
import { connectDB } from "./config";
import routes from './routes';
import path from "path";
import { startJobs } from "./jobs";

dotenv.config();

const app: Application = express();

app.use(cors());

// Middleware to parse incoming request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to DB
connectDB();

app.get('/', (req: Request, res: Response): any => {
    res.send('Hello World !!!');
});

// Route
app.use('/api', routes);

const PORT: string | number = process.env.PORT || 3000;

app.listen(PORT, (): void => {
    console.log(`Server is running on ${PORT}`);

    // Start cron jobs AFTER server starts
    startJobs();
});