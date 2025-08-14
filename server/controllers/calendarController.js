const { google } = require("googleapis");
const logger = require("../utils/logger");
require("dotenv").config({
	path: require("path").resolve(__dirname, "../.env"),
});
const { GOOGLE_CALENDAR_CREDENTIALS, TIMEZONE } = require("../config/config");

const CALENDAR_ID = process.env.SHARED_CALENDAR_ID || "primary";

const calendar = google.calendar("v3");

// Generate virtual meeting link
const generateVirtualMeetingLink = (meetingDetails) => {
	const meetingId = Date.now().toString();
	const roomName = `${meetingDetails.name
		.replace(/\s+/g, "-")
		.toLowerCase()}-${meetingId.slice(-6)}`;

	// Use Jitsi Meet
	return `https://meet.jit.si/${roomName}`;
};

const scheduleMeeting = async (meetingDetails) => {
	try {
		const auth = new google.auth.GoogleAuth({
			credentials: JSON.parse(GOOGLE_CALENDAR_CREDENTIALS),
			scopes: ["https://www.googleapis.com/auth/calendar"],
		});

		 const calendar = google.calendar({ version: 'v3', auth });
    
		const authClient = await auth.getClient();

		const event = {
			summary: meetingDetails.name,
			description: `Automatically scheduled by Assistant AI\n\nAttendees: ${meetingDetails.attendees.join(
				", "
			)}\n${
				meetingDetails.location === "virtual"
					? `\nVirtual Meeting\nMeeting Link: ${generateVirtualMeetingLink(
							meetingDetails
					  )}`
					: "\nIn-person meeting"
			}`,
			start: {
				dateTime: meetingDetails.start,
				timeZone: TIMEZONE,
			},
			end: {
				dateTime: meetingDetails.end,
				timeZone: TIMEZONE,
			},

			reminders: {
				useDefault: false,
				overrides: [
					{ method: "email", minutes: 24 * 60 },
					{ method: "popup", minutes: 10 },
				],
			},

			conferenceData: null,
		};

		const response = await calendar.events.insert({
			auth: authClient,
			calendarId: CALENDAR_ID,
			resource: event,
			conferenceDataVersion: 0,
			sendUpdates: "none",
		});
		logger.info("Meeting scheduled successfully", response.data.id);
		return response.data;
	} catch (error) {
		logger.error(`Calendar API error: ${error.message}`);
		logger.error(`Error details:`, error);
		throw new Error(`Failed to schedule meeting: ${error.message}`);
	}
};

module.exports = { scheduleMeeting };
