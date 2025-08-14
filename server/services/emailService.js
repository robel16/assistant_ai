require("dotenv").config();
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");
const { MAIL_TRAP_SMTP_USER, MAIL_TRAP_SMTP_PASS } = require("../config/config");

const validateEnv = () => {
	const requiredVars = ["DEFAULT_FROM_EMAIL", "MAIL_TRAP_SMTP_USER", "MAIL_TRAP_SMTP_PASS"];
	const missingVars = requiredVars.filter((varName) => !process.env[varName]);

	if (missingVars.length > 0) {
		logger.error(`❌ Missing environment variables: ${missingVars.join(", ")}`);
		throw new Error("Email configuration incomplete");
	}
};

//  Mailtrap SMTP transporter
const getMailtrapTransporter = () => {
	return nodemailer.createTransport({
		host: "sandbox.smtp.mailtrap.io",
		port: 2525,
		auth: {
			user: MAIL_TRAP_SMTP_USER,
			pass: MAIL_TRAP_SMTP_PASS,
		},
	});
};


const getGmailTransporter = () => {
	return nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 587,
		secure: false,
		auth: {
			user: process.env.GMAIL_USER, 
			pass: process.env.GMAIL_APP_PASSWORD, 
		},
	});
};

const getMailgunTransporter = () => {
	return nodemailer.createTransport({
		host: "smtp.mailgun.org",
		port: 587,
		auth: {
			user: "postmaster@your-domain.mailgun.org", 
			pass: process.env.MAILGUN_API_KEY,
		},
	});
};

const sendEmail = async (emailData) => {
	try {
		validateEnv();
		
		
		let transporter;
		if (process.env.SEND_REAL_EMAILS === 'true') {
			transporter = getGmailTransporter(); 
			logger.info("📧 Using Gmail for real email delivery");
		} else if (process.env.NODE_ENV === 'production') {
			transporter = getMailgunTransporter();
			logger.info("📧 Using Mailgun for production emails");
		} else {
			transporter = getMailtrapTransporter();
			logger.info("📧 Using Mailtrap for testing (emails won't be delivered)");
		}

		const info = await transporter.sendMail({
			from: `"AI Executive Assistant" <${process.env.DEFAULT_FROM_EMAIL}>`,
			to: Array.isArray(emailData.to) ? emailData.to.join(", ") : emailData.to,
			subject: emailData.subject,
			text: emailData.text,
			html: emailData.html,
		});

		logger.info(`📧 Email sent: ${info.messageId}`);
		return info;
	} catch (error) {
		logger.error(`❌ Email send error: ${error.message}`);
		throw new Error(`Failed to send email: ${error.message}`);
	}
};
const generateFollowUpTemplate = (meetingDetails) => {
	return `
    <h2>Meeting Follow-up: ${meetingDetails.name}</h2>
    <p><strong>Date:</strong> ${new Date(
			meetingDetails.start
		).toLocaleString()}</p>
    <p><strong>Attendees:</strong> ${meetingDetails.attendees.join(", ")}</p>
    
    <h3>Action Items:</h3>
    <ul>
      ${meetingDetails.actionItems
				.map(
					(item) => `
        <li>
          <strong>${item.task}</strong><br>
          Owner: ${item.owner}<br>
          Deadline: ${item.deadline}
        </li>
      `
				)
				.join("")}
    </ul>
    
    <p>Please complete your action items by the specified deadlines.</p>
  `;
};


const generateReminderTemplate = (reminder) => {
    const urgencyClass = reminder.priority === 'high' ? 'high-priority' : 
                        reminder.priority === 'low' ? 'low-priority' : 'medium-priority';
    
    const reminderTypeText = reminder.reminderType === '24-hour' ? '24-Hour Advance Notice' :
                           reminder.reminderType === '1-hour' ? '1-Hour Advance Notice' :
                           reminder.reminderType === '1-minute' ? '⚡ URGENT - 1-Minute Notice' :
                           'Due Now';
    
    const timeText = reminder.reminderType === '1-minute' ? 
        `⚡ Due in ${Math.round(reminder.minutesUntilDue)} minute(s) - URGENT!` :
        reminder.hoursUntilDue > 0 ? 
        `Due in ${Math.round(reminder.hoursUntilDue)} hours` : 
        'Due now';
        
	return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">📅 Task Reminder: ${reminder.name}</h2>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>📍 ${reminderTypeText}</strong></p>
            <p><strong>Due Date:</strong> ${new Date(reminder.dueDate).toLocaleString()}</p>
            <p><strong>Priority:</strong> <span style="color: ${reminder.priority === 'high' ? '#ff4444' : reminder.priority === 'low' ? '#888' : '#ff8800'};">${(reminder.priority || 'Medium').toUpperCase()}</span></p>
            <p><strong>Status:</strong> ${timeText}</p>
        </div>
        
        <div style="background: white; border-left: 4px solid #007cba; padding: 15px; margin: 15px 0;">
            <h3 style="margin-top: 0;">Task Details:</h3>
            <p>${reminder.name}</p>
        </div>
        
        ${reminder.reminderType === '1-minute' ? 
            '<div style="background: #ffcccc; border: 2px solid #ff0000; padding: 15px; border-radius: 5px; margin: 15px 0;"><strong>🚨 URGENT: Task due in 1 minute! Drop everything and complete this now!</strong></div>' :
            reminder.priority === 'high' && reminder.hoursUntilDue < 2 ? 
            '<div style="background: #ffe6e6; padding: 10px; border-radius: 5px; margin: 15px 0;"><strong>⚠️ HIGH PRIORITY TASK - Immediate attention required!</strong></div>' : ''
        }
        
        <div style="background: #e6f3ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4>Quick Actions:</h4>
            <p>• Mark as completed when finished</p>
            <p>• Set a new reminder if you need more time</p>
            <p>• Contact your team if assistance is needed</p>
        </div>
        
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
            <small>🤖 This is an automated reminder from your AI Executive Assistant.<br>
            Reminder Type: ${reminderTypeText}</small>
        </p>
    </div>
  `;
};

module.exports = { sendEmail, generateFollowUpTemplate, generateReminderTemplate };
