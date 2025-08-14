const winston = require("winston");
const { LOG_LEVEL } = require("../config/config");
const { format } = winston;

const logFormat = format.printf(({ level, message, timestamp, stack }) => {
	return `${timestamp} ${level}: ${message} ${stack || ""}`;
});

const logger = winston.createLogger({
	level: LOG_LEVEL || "info",
	format: format.combine(
		format.timestamp({ format: "YYY-MM-HH:mm:ss" }),
		format.errors({ stack: true }),
		logFormat
	),
	transports: [
		new winston.transports.Console({
			format: format.combine(format.colorize(), logFormat),
		}),
		new winston.transports.File({ filename: "logs/error.log", level: "error" }),
		new winston.transports.File({ filename: "logs/combined.log" }),
	],
});

module.exports = logger;
