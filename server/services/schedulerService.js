const cron = require('node-cron');
const Reminder = require('../models/reminderModel');
const { sendReminderEmail } = require('../controllers/emailController');
const logger = require('../utils/logger');

const initScheduler = () => {

  cron.schedule('0 8 * * *', async () => {
    try {
      logger.info('⏰ Running daily reminder check...');
      
      const dueReminders = await Reminder.getDueReminders();
      
      let processedCount = 0;
      let errorCount = 0;
      
      for (const reminder of dueReminders) {
        try {
          
          await sendReminderEmail(reminder);
          
          
          reminder.status = 'processed';
          await reminder.save();
          
          processedCount++;
          logger.info(`✅ Sent reminder: ${reminder.task} (ID: ${reminder._id})`);
        } catch (emailError) {
          errorCount++;
          logger.error(`❌ Failed to process reminder ${reminder._id}: ${emailError.message}`);
        }
      }
      
      logger.info(`Reminder processing complete. Success: ${processedCount}, Errors: ${errorCount}`);
    } catch (error) {
      logger.error(`🔥 Scheduler job failed: ${error.message}`);
    }
  });
  
  logger.info('🔄 Scheduler initialized successfully');
};

module.exports = { initScheduler };