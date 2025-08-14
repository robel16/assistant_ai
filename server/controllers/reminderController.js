const Reminder = require('../models/reminderModel');
const { sendReminderEmail } = require('./emailController');
const logger = require('../utils/logger');

const processDueReminders = async () => {
    try {
        const now = new Date();
        
        // Get reminders 
        const upcomingReminders = await Reminder.find({
            $or: [
                { dueDate: { $lte: now }, status: 'pending' },
                // Due in 24 hours (daily reminder)
                { 
                    dueDate: { 
                        $gte: new Date(now.getTime() + 23 * 60 * 60 * 1000),
                        $lte: new Date(now.getTime() + 25 * 60 * 60 * 1000)
                    }, 
                    status: 'pending',
                    $or: [
                        { dailyReminderSent: { $exists: false } },
                        { dailyReminderSent: false }
                    ]
                },
                // Due in 1 hour (hourly reminder)
                { 
                    dueDate: { 
                        $gte: new Date(now.getTime() + 55 * 60 * 1000),
                        $lte: new Date(now.getTime() + 65 * 60 * 1000)
                    }, 
                    status: 'pending',
                    $or: [
                        { hourlyReminderSent: { $exists: false } },
                        { hourlyReminderSent: false }
                    ]
                },
                // Due in 1 minute (immediate reminder)
                { 
                    dueDate: { 
                        $gte: new Date(now.getTime() + 30 * 1000),
                        $lte: new Date(now.getTime() + 90 * 1000)  
                    }, 
                    status: 'pending',
                    $or: [
                        { minuteReminderSent: { $exists: false } },
                        { minuteReminderSent: false }
                    ]
                }
            ]
        });

        logger.info(`Found ${upcomingReminders.length} reminders to process`);

        let processed = 0;
        for (const reminder of upcomingReminders) {
            try {
                const timeUntilDue = reminder.dueDate.getTime() - now.getTime();
                const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);
                
                const minutesUntilDue = timeUntilDue / (1000 * 60);
                
                let reminderType = 'due';
                let updateField = 'status';
                let updateValue = 'sent';
                
                if (hoursUntilDue > 12) {
                    reminderType = '24-hour';
                    updateField = 'dailyReminderSent';
                    updateValue = true;
                } else if (hoursUntilDue > 0.5 && hoursUntilDue < 2) {
                    reminderType = '1-hour';
                    updateField = 'hourlyReminderSent';
                    updateValue = true;
                } else if (minutesUntilDue > 0.5 && minutesUntilDue < 2) {
                    reminderType = '1-minute';
                    updateField = 'minuteReminderSent';
                    updateValue = true;
                }

                // Send reminder email with context
                await sendReminderEmail({
                    attendees: [reminder.userId],
                    name: reminder.task,
                    dueDate: reminder.dueDate,
                    reminderType: reminderType,
                    priority: reminder.priority,
                    hoursUntilDue: Math.max(0, hoursUntilDue),
                    minutesUntilDue: Math.max(0, minutesUntilDue)
                });

                // Update reminder status
                reminder[updateField] = updateValue;
                await reminder.save();
                
                logger.info(`${reminderType} reminder sent for: ${reminder.task}`);
                processed++;
                
            } catch (error) {
                logger.error(`Failed to send reminder for ${reminder.task}: ${error.message}`);
            }
        }

        return {
            processed: processed,
            total: upcomingReminders.length,
            success: true
        };
    } catch (error) {
        logger.error(`Error processing due reminders: ${error.message}`);
        throw error;
    }
};

const createReminder = async (reminderData) => {
    try {
        const reminder = new Reminder(reminderData);
        await reminder.save();
        logger.info(`Reminder created: ${reminder.task}`);
        return reminder;
    } catch (error) {
        logger.error(`Error creating reminder: ${error.message}`);
        throw error;
    }
};

const getAllReminders = async (userId) => {
    try {
        const reminders = await Reminder.find({ userId }).sort({ dueDate: 1 });
        return reminders;
    } catch (error) {
        logger.error(`Error fetching reminders: ${error.message}`);
        throw error;
    }
};

const updateReminderStatus = async (reminderId, status) => {
    try {
        const reminder = await Reminder.findByIdAndUpdate(
            reminderId,
            { status },
            { new: true }
        );
        return reminder;
    } catch (error) {
        logger.error(`Error updating reminder status: ${error.message}`);
        throw error;
    }
};

module.exports = {
    processDueReminders,
    createReminder,
    getAllReminders,
    updateReminderStatus
};
