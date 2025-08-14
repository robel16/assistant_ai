const {
	sendEmail,
	generateFollowUpTemplate,
} = require("../services/emailService");
const logger = require("../utils/logger");

const sendConfirmation = async (details) => {
	try {
		await sendEmail({
			to: details.to,
			subject: details.subject,
			text: details.text,
		});
		return true;
	} catch (error) {
		logger.error(`Confirmation email failed: ${error.message}`);
		return false;
	}
};

const sendFollowUpEmail = async (meetingDetails) => {
	try {
		const htmlContent = generateFollowUpTemplate(meetingDetails);
		await sendEmail({
			to: meetingDetails.attendees,
			subject: `Follow-up: ${meetingDetails.name}`,
			html: htmlContent,
		});
		return true;
	} catch (error) {
		logger.error(`Follow-up email failed: ${error.message}`);
		return false;
	}
};

const sendReminderEmail = async (reminder) => {
	try {
		await sendEmail({
			to: reminder.attendees,
			subject: `Reminder: ${reminder.name}`,
			html: generateReminderTemplate(reminder),
		});
		return true;
	} catch (error) {
		logger.error(`Reminder email failed: ${error.message}`);
		return false;
	}
};

module.exports = {
    sendConfirmation,
    sendFollowUpEmail,
    sendReminderEmail,
}

