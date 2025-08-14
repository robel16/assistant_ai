require("dotenv").config();
const nodemailer = require("nodemailer");
const { DEFAULT_FROM_EMAIL } = require("../config/config");
const { sendEmail } = require("../services/emailService");
const logger = require("../utils/logger");

(async () => {
	try {
		logger.info("🚀 Starting email test...");

		const testEmail = {
			to: DEFAULT_FROM_EMAIL,
			subject: "Test Email from AI Executive Assistant",
			text: "This is a test email from the AI Executive Assistant project.",
			html: "<p>This is a <strong>test email</strong> from the AI Executive Assistant project.</p>",
		};

		logger.info("Sending test email to:", testEmail.to);
		const result = await sendEmail(testEmail);

		logger.info("✅ Email test succeeded!");
		logger.info("Message ID:", result.messageId);
		logger.info("Preview URL:", nodemailer.getTestMessageUrl(result));
	} catch (error) {
		logger.error("❌ Email test failed:", error.message);
		process.exit(1);
	}
})();
