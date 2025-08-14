require("dotenv").config();
const {GoogleGenerativeAI} = require("@google/generative-ai");
const { GEMINI_API_KEY } = require("../config/config");
const {validateMeetingDetails} = require('../utils/validator');

const debugParseRequest = async (text) => {
    try {
        console.log("1. Starting parseRequest debug...");
        console.log("Input text:", text);

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig:{
                maxOutputTokens:500,
                temperature:0.3
            }
        });
        
        const prompt = `You are an executive assistant AI. Extract meeting details from this request:
    Return JSON with these fields: 
    - action: "schedule", "reschedule", or "cancel"
    - name: meeting name (string)
    - start: ISO 8601 datetime
    - end: ISO 8601 datetime
    - attendees: array of email strings
    - reminder: boolean (true if user requested reminder)
    - duration: meeting duration in minutes
    - location: "in-person" or "virtual"
    
    Input: ${text}
    
    Example response: 
    {
      "action": "schedule",
      "name": "Product Strategy Meeting",
      "start": "2025-08-15T14:00:00Z",
      "end": "2025-08-15T15:00:00Z",
      "duration": 60,
      "attendees": ["cto@company.com", "pm@company.com"],
      "reminder": true,
      "location": "virtual"
    }`;

        console.log("2. Sending request to Gemini...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();
        
        console.log("3. Raw response from Gemini:");
        console.log(rawText);
        
        const jsonString = rawText.replace(/```json|```/g, '').trim();
        console.log("4. Cleaned JSON string:");
        console.log(jsonString);
        
        let meetingDetails;
        try {
            meetingDetails = JSON.parse(jsonString);
            console.log("5. Parsed JSON successfully:");
            console.log(meetingDetails);
        } catch(parseError) {
            console.log("❌ JSON parse error:", parseError.message);
            return;
        }
        
        try {
            console.log("6. Validating meeting details...");
            validateMeetingDetails(meetingDetails);
            console.log("✅ Validation passed!");
            return meetingDetails;
        } catch(validationError) {
            console.log("❌ Validation error:", validationError.message);
            return;
        }

    } catch(error) {
        console.log("❌ Overall error:", error.message);
        console.log("Full error:", error);
    }
};

const testText = "Schedule a team meeting tomorrow at 2 PM with john@example.com for 1 hour";
debugParseRequest(testText);
