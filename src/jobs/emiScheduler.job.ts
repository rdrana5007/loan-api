import cron from 'node-cron';
import { autoScheduler } from '../controllers';

export const startEmiScheduler = () => {
    // Run every day at 12:00 AM '0 0 * * *'
    cron.schedule('* * * * *', async () => {
        console.log('Running EMI auto-scheduler...');
        await autoScheduler();
    }, {
        timezone: 'Asia/Kolkata'
    });
    console.log('EMI Scheduler initialized');
};

// Run every minute (testing) '* * * * *'
// Run every day at 12:00 AM '0 0 * * *'