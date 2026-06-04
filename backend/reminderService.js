import cron from 'node-cron';
import { getAllTasksDueSoon } from './models/task.js';

export const initReminderJob = () => {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        console.log('Running background reminder job...');
        try {
            const tasks = await getAllTasksDueSoon();
            tasks.forEach(task => {
                const now = new Date();
                const dueDate = new Date(task.due_date);
                const type = dueDate < now ? 'OVERDUE' : 'DUE SOON';
                
                console.log(`[REMINDER] Task "${task.title}" is ${type} for user ${task.username} (${task.user_email})`);
                console.log(`           Due Date: ${task.due_date}`);
            });
        } catch (err) {
            console.error('Error in reminder job:', err);
        }
    });
    console.log('Reminder background job initialized (Hourly)');
};
