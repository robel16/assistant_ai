require("dotenv").config();
const { GOOGLE_CALENDAR_CREDENTIALS } = require('../config/config');

console.log("=== DEBUGGING GOOGLE CALENDAR CREDENTIALS ===");
console.log("1. Credentials exists:", GOOGLE_CALENDAR_CREDENTIALS ? "YES" : "NO");
console.log("2. Credentials length:", GOOGLE_CALENDAR_CREDENTIALS ? GOOGLE_CALENDAR_CREDENTIALS.length : 0);
console.log("3. First 50 characters:", GOOGLE_CALENDAR_CREDENTIALS ? GOOGLE_CALENDAR_CREDENTIALS.substring(0, 50) : "N/A");
console.log("4. Last 50 characters:", GOOGLE_CALENDAR_CREDENTIALS ? GOOGLE_CALENDAR_CREDENTIALS.substring(GOOGLE_CALENDAR_CREDENTIALS.length - 50) : "N/A");

try {
    console.log("5. Attempting to parse JSON...");
    const parsed = JSON.parse(GOOGLE_CALENDAR_CREDENTIALS);
    console.log("6. ✅ JSON parsing successful!");
    console.log("7. Has client_email:", parsed.client_email ? "YES" : "NO");
    console.log("8. Has private_key:", parsed.private_key ? "YES" : "NO");
    console.log("9. Type:", parsed.type);
} catch (error) {
    console.log("6. ❌ JSON parsing failed:");
    console.log("Error:", error.message);
    console.log("Problem character position:", error.message.match(/position (\d+)/)?.[1] || "unknown");
}
