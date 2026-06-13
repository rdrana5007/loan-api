import cron from 'node-cron';
import { autoBorrowingInstallmentScheduler, autoEmiScheduler } from '../services';

export const startEmiScheduler = () => {
    let isRunning: boolean = false;

    // Run every 1 hour
    cron.schedule('0 * * * *', async () => {
        if (isRunning) return;

        isRunning = true;

        try {
            console.log('Running auto schedulers...');

            await Promise.all([
                autoEmiScheduler(),
                autoBorrowingInstallmentScheduler()
            ]);
        } catch (error) {
            console.error('Auto Scheduler error:', error);
        } finally {
            isRunning = false;
        }
    }, {
        timezone: 'Asia/Kolkata'
    });

    console.log('Auto Schedulers initialized');
};

// Run every minute (testing) '* * * * *'
// Run every 1 hour '0 * * * *'
// Run every day at 12:00 AM '0 0 * * *'