const express = require('express');
const router = express.Router();
const { processDueReminders } = require('../controllers/reminderController');


router.get('/quick-check', async (req, res) => {
  try {
    const result = await processDueReminders();
    res.json({ 
      status: 'success', 
      message: 'Quick reminder check completed',
      processed: result.processed,
      total: result.total,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const Reminder = require('../models/reminderModel');
    const now = new Date();
    
    const stats = {
      total: await Reminder.countDocuments(),
      pending: await Reminder.countDocuments({ status: 'pending' }),
      sent: await Reminder.countDocuments({ status: 'sent' }),
      dueToday: await Reminder.countDocuments({
        dueDate: { 
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        }
      }),
      overdue: await Reminder.countDocuments({
        dueDate: { $lt: now },
        status: 'pending'
      })
    };
    
    res.json({
      status: 'success',
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
});

module.exports = router;
