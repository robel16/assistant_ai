require("dotenv").config();
const { parseRequest } = require('../services/geminiService');
const { TIMEZONE } = require('../config/config');

const debugTimezone = async () => {
    try {
        console.log("🕐 DEBUGGING TIMEZONE ISSUE");
        console.log("=".repeat(50));
        
        console.log("1. Current system time:", new Date().toLocaleString());
        console.log("2. System timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
        console.log("3. Configured TIMEZONE:", TIMEZONE || "Not set");
        console.log("4. UTC time:", new Date().toISOString());
        
        console.log("\n🤖 Testing AI parsing...");
        const testText = "Schedule a team meeting today at 12:30 PM with robelmuluwork91@gmail.com for 10 minutes";
        console.log("Input:", testText);
        
        const result = await parseRequest(testText);
        console.log("\n📋 AI Generated Result:");
        console.log("- Start time:", result.start);
        console.log("- End time:", result.end);
        console.log("- Start parsed:", new Date(result.start).toLocaleString());
        console.log("- End parsed:", new Date(result.end).toLocaleString());
        
        console.log("\n⏰ Time Analysis:");
        const startTime = new Date(result.start);
        const now = new Date();
        const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        console.log(`- Time difference from now: ${diffHours.toFixed(2)} hours`);
        
    } catch (error) {
        console.log("❌ Debug error:", error.message);
    }
};

debugTimezone();
