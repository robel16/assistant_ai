const mongoose = require('mongoose');
const Reminder = require('../models/reminderModel');
const logger = require('../utils/logger');

const MONGODB_TEST_URI = 'mongodb://localhost:27017/executive-assistant-test';

async function testGetDueReminders() {
  try {
    logger.info('🔧 Connecting to test database...');
    await mongoose.connect(MONGODB_TEST_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.info('✅ Connected to test database');
    
    // Create test reminders
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 1); 
    
    const testReminders = [
      { 
        task: 'Past Due Task', 
        dueDate: pastDate, 
        userId: 'test@example.com',
        status: 'pending'
      },
      { 
        task: 'Future Task', 
        dueDate: new Date(now.getFullYear() + 1, 0, 1), 
        userId: 'test@example.com',
        status: 'pending'
      }
    ];
    
    logger.info('🧪 Inserting test reminders...');
    await Reminder.deleteMany({});
    const created = await Reminder.insertMany(testReminders);
    logger.info(`📝 Inserted test reminders: ${created.map(r => r.task).join(', ')}`);
    
    // Test getDueReminders
    logger.info('🔍 Retrieving due reminders...');
    const dueReminders = await Reminder.getDueReminders();
    logger.info(`📅 Due reminders found: ${dueReminders.length}`);
    logger.info(`📋 Tasks: ${dueReminders.map(r => r.task).join(', ')}`);
    
    if (dueReminders.length !== 1 || dueReminders[0].task !== 'Past Due Task') {
      throw new Error('Test failed: Incorrect due reminders retrieved');
    }
    
    logger.info('✅ getDueReminders test passed successfully');
  } catch (error) {
    logger.error(`❌ Test failed: ${error.message}`);
  } finally {
    await mongoose.disconnect();
    logger.info('🔌 Disconnected from database');
  }
}

testGetDueReminders();