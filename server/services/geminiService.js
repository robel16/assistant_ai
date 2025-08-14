const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../utils/logger");
const { validateMeetingDetails } = require("../utils/validator");
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GEMINI_API_KEY } = require("../config/config");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const emailRegex =
	/(\b[a-zA-Z0-9._%+-]+(?:@|(?:\s*(?:at|where)\s*))[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b)|([a-zA-Z0-9._%+-]+\s*\b(gmail|yahoo|outlook)\s*\.[a-zA-Z]{2,}\b)/gi;

const parseRequest = async (text) => {
	try {
		const model = genAI.getGenerativeModel({
			model: "gemini-1.5-flash",
			generationConfig: {
				maxOutputTokens: 500,
				temperature: 0.3,
			},
		});
		const currentDate = new Date().toISOString().split("T")[0];
		const currentTime = new Date().toLocaleString();
		const userTimezone = process.env.TIMEZONE || "UTC";

		const prompt = `You are an executive assistant AI. 
    
Current context:
- Today's date: ${currentDate}
- Current time: ${currentTime} 
- User timezone: ${userTimezone}

IMPORTANT TIME PARSING RULES:
- When user says "12:20 PM", convert it to exactly 12:20 PM in ${userTimezone} timezone
- When user says "2:30 PM", convert it to exactly 2:30 PM in ${userTimezone} timezone  
- DO NOT add or subtract hours from the time the user specifies
- Use 24-hour format in ISO string but preserve the EXACT time requested

Extract meeting details from this request:
    
Input: "${text}"
    
Return JSON with these fields: 
    - action: "schedule", "reschedule", or "cancel"
    - name: meeting name (string)
    - start: ISO 8601 datetime with timezone offset for ${userTimezone} (use current year 2025)
    - end: ISO 8601 datetime with timezone offset for ${userTimezone} (use current year 2025)
    - attendees: array of email strings
    - reminder: boolean (true if user requested reminder)
    - duration: meeting duration in minutes
    - location: "in-person" or "virtual"
    
Example: If user says "meeting at 12:30 PM" in Africa/Nairobi timezone, return:
    {
      "action": "schedule",
      "name": "Meeting",
      "start": "2025-08-13T12:30:00+03:00",
      "end": "2025-08-13T13:30:00+03:00",
      "duration": 60,
      "attendees": ["user@example.com"],
      "reminder": false,
      "location": "virtual"
    }`;

		const result = await model.generateContent(prompt);
		const response = await result.response;
		const jsonString = response
			.text()
			.replace(/```json|```/g, "")
			.trim();

		let meetingDetails;
		try {
			meetingDetails = JSON.parse(jsonString);
		} catch (parseError) {
			logger.error(`JSON parse error: ${parseError.message}`);
			logger.error(`Raw response: ${jsonString}`);
			throw new Error("Failed to parse meeting details");
		}

		validateMeetingDetails(meetingDetails);
		logger.info("Meeting details parsed successfully", meetingDetails);
		return meetingDetails;
	} catch (error) {
		logger.error(`NLP Processing Failed: ${error.message}`);
		throw new Error(`Failed to process request with AI: ${error.message}`);
	}
};

module.exports = {
	parseRequest,
};
