require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { PORT, MONGODB_URL } = require("./config/config");
const { initScheduler } = require("./services/schedulerService");
const cors = require('cors')

const Reminder = require("./models/reminderModel");

const logger = require("./utils/logger");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
	logger.info(`${req.method} ${req.originalUrl}`);
	next();
});
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Accept, Content-Type, access-control-allow-origin, x-api-applicationid, authorization',
  );
  res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, PATCH, POST, DELETE');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Expose-Headers', 'x-new-token');
  next();
});


// API Routes
const apiRoutes = require('./api/routes');
const cronRoutes = require('./api/cronRoute');
const quickRemindersRoutes = require('./api/quickRemindersRoute');
app.use('/api', apiRoutes);
app.use('/cron', cronRoutes);
app.use('/reminders', quickRemindersRoutes);
mongoose
	.connect(MONGODB_URL, {})
	.then(() => {
		logger.info("mongoDb connected"), console.log("mongoDb connected");
		initScheduler();
	})

	.catch((err) => logger.error("mongoDb connection failed", err));

app.get("/health", (req, res) => {
	res.status(200).json({
		status: "health",
		timeStamp: new Date().toISOString(),
		services: ["nlp", "calendar", "email", "reminder"],
	});
});

app.use((err, req, res, next) => {
	console.log(err);
	res.status(500).json({
		status: "error",
		message: "Internal server error",
	});
	logger.error("Internal server error", err);
});

app.listen(PORT, () => {
	console.log(`server is running on ${PORT}`);

	logger.info(`server is running on ${PORT}`);
});
