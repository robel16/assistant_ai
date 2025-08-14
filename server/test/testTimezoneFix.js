require("dotenv").config();
const { parseRequest } = require('../services/geminiService');

const testTimezoneFix = async () => {
    try {
        console.log("🧪 Testing timezone fix...");
        
        const testCases = [
            "Schedule a team meeting today at 12:20 PM with test@example.com for 5 minutes",
            "Schedule a demo today at 1:00 PM with client@example.com for 30 minutes",
            "Schedule a standup today at 9:00 AM with team@example.com for 15 minutes"
        ];
        
        for (const testText of testCases) {
            console.log(`\n📝 Testing: "${testText}"`);
            
            const result = await parseRequest(testText);
            
            console.log(`⏰ Generated times:`);
            console.log(`- Start: ${result.start} (${new Date(result.start).toLocaleString()})`);
            console.log(`- End: ${result.end} (${new Date(result.end).toLocaleString()})`);
        }
        
    } catch (error) {
        console.log("❌ Error:", error.message);
    }
};

testTimezoneFix();
