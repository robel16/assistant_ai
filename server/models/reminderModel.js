const mongoose = require('mongoose');
const logger = require('../utils/logger');

const reminderSchema = new mongoose.Schema({
  task: {
    type: String,
    required: true,
    trim: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  userId: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'snoozed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
reminderSchema.index({ dueDate: 1, status: 1 });
reminderSchema.index({ userId: 1, status: 1 });


reminderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

reminderSchema.statics.createReminder = async function(reminderData) {
  try {
    const reminder = new this(reminderData);
    await reminder.save();
    logger.info(`Reminder created: ${reminder._id}`);
    return reminder;
  } catch (error) {
    logger.error(`Reminder creation error: ${error.message}`);
    throw new Error('Failed to create reminder');
  }
};

reminderSchema.statics.getDueReminders = async function() {
  try {
    const now = new Date();
    return await this.find({
      dueDate: { $lte: now },
      status: 'pending'
    }).sort({ priority: -1, dueDate: 1 });
  } catch (error) {
    logger.error(`Reminder query error: ${error.message}`);
    throw new Error('Failed to retrieve due reminders');
  }
};

const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = Reminder;