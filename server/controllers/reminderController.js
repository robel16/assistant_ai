// controllers/reminderController.js
const Reminder = require("../models/reminderModel");
const logger = require("../utils/logger");

/**
 * POST /reminder
 * Create a new reminder. Uses userId from body (no auth).
 */
exports.createReminder = async (req, res) => {
  try {
    const { task, dueDate, userId, priority } = req.body;

    if (!task || !dueDate || !userId) {
      return res.status(400).json({ success: false, message: "task, dueDate and userId are required" });
    }

    const reminderData = {
      task: task.trim(),
      dueDate: new Date(dueDate),
      userId,
      priority: priority || "medium",
      status: "pending"
    };

    const reminder = await Reminder.createReminder(reminderData);
    return res.status(201).json({ success: true, data: reminder });
  } catch (error) {
    logger.error(`createReminder controller error: ${error.message}`);
    return res.status(400).json({ success: false, message: "Failed to create reminder", error: error.message });
  }
};

/**
 * GET /reminders
 * Returns paginated reminders.
 * Optional query params:
 *  - userId (if provided, filters to that user's reminders)
 *  - page, limit, status
 *
 * If no userId is provided, returns reminders across all users.
 */
exports.getAllReminders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, parseInt(req.query.limit || "50", 10));
    const status = req.query.status;
    const userId = req.query.userId; // optional since auth is disabled

    const query = {};
    if (typeof userId !== "undefined") query.userId = userId;
    if (typeof status !== "undefined") query.status = status;

    const total = await Reminder.countDocuments(query);
    const pages = total === 0 ? 0 : Math.ceil(total / limit);
    const reminders = await Reminder.find(query)
      .sort({ dueDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      data: reminders,
      meta: {
        total,
        page,
        pages,
        limit
      }
    });
  } catch (error) {
    logger.error(`getAllReminders controller error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to fetch reminders", error: error.message });
  }
};

/**
 * GET /reminder/:id
 * Return a single reminder (no owner checks).
 */
exports.getReminder = async (req, res) => {
  try {
    const reminderId = req.params.id;
    if (!reminderId) return res.status(400).json({ success: false, message: "Missing reminder id" });

    const reminder = await Reminder.findById(reminderId).lean();
    if (!reminder) return res.status(404).json({ success: false, message: "Reminder not found" });

    return res.json({ success: true, data: reminder });
  } catch (error) {
    logger.error(`getReminder controller error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to fetch reminder", error: error.message });
  }
};

/**
 * PATCH /reminder/:id
 * Body may include:
 *  - status: 'pending'|'processed'|'snoozed'
 *  - snoozeMinutes: number -> postpone dueDate by that many minutes and set status to 'snoozed'
 *  - dueDate: ISO date -> update dueDate
 *  - task, priority -> update fields
 *
 * No auth / owner checks in this version.
 */
exports.updateReminder = async (req, res) => {
  try {
    const reminderId = req.params.id;
    if (!reminderId) return res.status(400).json({ success: false, message: "Missing reminder id" });

    const reminder = await Reminder.findById(reminderId);
    if (!reminder) return res.status(404).json({ success: false, message: "Reminder not found" });

    const { status, snoozeMinutes, dueDate, task, priority } = req.body;
    let changed = false;

    if (typeof task === "string") {
      reminder.task = task.trim();
      changed = true;
    }
    if (typeof priority === "string") {
      reminder.priority = priority;
      changed = true;
    }
    if (dueDate) {
      const newDue = new Date(dueDate);
      if (isNaN(newDue.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid dueDate" });
      }
      reminder.dueDate = newDue;
      changed = true;
    }

    if (typeof snoozeMinutes !== "undefined") {
      const mins = Number(snoozeMinutes);
      if (isNaN(mins)) {
        return res.status(400).json({ success: false, message: "snoozeMinutes must be a number" });
      }
      reminder.dueDate = new Date(Date.now() + mins * 60 * 1000);
      reminder.status = "snoozed";
      reminder.dailyReminderSent = false;
      reminder.hourlyReminderSent = false;
      reminder.minuteReminderSent = false;
      changed = true;
    } else if (typeof status !== "undefined") {
      if (!["pending", "processed", "snoozed"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value" });
      }
      reminder.status = status;
      changed = true;
    }

    if (!changed) {
      return res.status(400).json({ success: false, message: "No valid update fields provided" });
    }

    await reminder.save();
    return res.json({ success: true, data: reminder });
  } catch (error) {
    logger.error(`updateReminder controller error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to update reminder", error: error.message });
  }
};

/**
 * DELETE /reminder/:id
 * No auth/owner checks here.
 */
exports.deleteReminder = async (req, res) => {
  try {
    const reminderId = req.params.id;
    if (!reminderId) return res.status(400).json({ success: false, message: "Missing reminder id" });

    const reminder = await Reminder.findById(reminderId);
    if (!reminder) return res.status(404).json({ success: false, message: "Reminder not found" });

    await Reminder.findByIdAndDelete(reminderId);
    return res.json({ success: true, message: "Reminder deleted" });
  } catch (error) {
    logger.error(`deleteReminder controller error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to delete reminder", error: error.message });
  }
};
