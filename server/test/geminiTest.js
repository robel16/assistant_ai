require("dotenv").config();
const { parseRequest } = require('../services/geminiService');
const logger = require('../utils/logger');

const testGemini = async () => {
    try {
        logger.info("🧪 Testing Gemini service...");
        const testText = "Schedule a team meeting tomorrow at 2 PM with john@example.com for 1 hour";
        
        logger.info("Input text:", testText);
        const result = await parseRequest(testText);
        
        logger.info("✅ Gemini test succeeded!");
        logger.info("Parsed result:", result);
    } catch (error) {
        logger.error("❌ Gemini test failed:", error.message);
        console.log("Full error:", error);
    }
};

testGemini();
