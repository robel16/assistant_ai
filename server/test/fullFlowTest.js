require("dotenv").config();
const { parseRequest } = require('../services/geminiService');
const { scheduleMeeting } = require('../controllers/mockCalendarController');
const { sendConfirmation } = require('../controllers/emailController');
const logger = require('../utils/logger');

const testFullFlow = async () => {
    try {
        logger.info("🧪 Testing full scheduling flow...");
        const testText = "Schedule a team meeting tomorrow at 2 PM with john@example.com for 1 hour";
        
        // Step 1: Parse request
        logger.info("Step 1: Parsing request...");
        const meetingDetails = await parseRequest(testText);
        logger.info("✅ Meeting details parsed:", meetingDetails);
        
        // Step 2: Schedule meeting
        logger.info("Step 2: Scheduling meeting...");
        const event = await scheduleMeeting(meetingDetails);
        logger.info("✅ Meeting scheduled:", event.id);
        
        // Step 3: Send confirmation
        logger.info("Step 3: Sending confirmation email...");
        await sendConfirmation({
            to: meetingDetails.attendees,
            subject: `Meeting Scheduled: ${meetingDetails.name}`,
            text: `Your meeting "${meetingDetails.name}" has been scheduled for ${meetingDetails.start}`,
        });
        logger.info("✅ Confirmation sent!");
        
        logger.info("🎉 Full flow test completed successfully!");
        
    } catch (error) {
        logger.error("❌ Full flow test failed:", error.message);
        console.log("Full error:", error);
    }
};

testFullFlow();
