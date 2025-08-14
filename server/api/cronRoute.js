const express = require('express');
const router = express.Router();
const { processDueReminders } = require('../controllers/reminderController');

// Endpoint for Cloud Scheduler to trigger daily check
router.get('/daily-check', async (req, res) => {
  try {
    const result = await processDueReminders();
    res.json({ 
      status: 'success', 
      message: 'Reminder check completed',
      processed: result.processed
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
});

module.exports = router;