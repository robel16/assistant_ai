// routes/reminderRoutes.js
const express = require("express");
const router = express.Router();
const { processScheduleRequest } = require("../controllers/nlpController");
const reminderController = require("../controllers/reminderController");

// POST /schedule (unchanged)
router.post("/schedule", async (req, res) => {
  await processScheduleRequest(req, res);
});

// POST /reminder -> handled by controller (no auth)
router.post("/reminder", reminderController.createReminder);

// GET /reminders -> paginated + metadata (no auth required)
// Optional query params: userId, page, limit, status
router.get("/reminders", reminderController.getAllReminders);

// GET /reminder/:id -> single reminder (no owner checks)
router.get("/reminder/:id", reminderController.getReminder);

// PATCH /reminder/:id -> update status / snooze / other fields (no auth)
router.patch("/reminder/:id", reminderController.updateReminder);

// DELETE /reminder/:id -> no auth
router.delete("/reminder/:id", reminderController.deleteReminder);

// placeholder reschedule route
router.post("/reschedule", async (req, res) => {
  res.status(501).json({ message: "Rescheduling not implemented yet" });
});

module.exports = router;
