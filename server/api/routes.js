const express = require("express");
const router = express.Router();
const { processScheduleRequest } = require("../controllers/nlpController");
const Reminder = require("../models/reminderModel");

router.post("/schedule", async (req, res) => {
	await processScheduleRequest(req, res);
});


router.post("/reminder", async (req, res) => {
	try {
		const { task, dueDate, userId, priority } = req.body;
		const reminder = await Reminder.createReminder({
			task,
			dueDate: new Date(dueDate),
			userId,
			priority: priority || "medium",
		});
		res.status(201).json(reminder);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

router.post("/reschedule", async (req, res) => {
	res.status(501).json({ message: "Rescheduling not implemented yet" });
});

module.exports = router;
