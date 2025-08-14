require("dotenv").config();
const {google} = require('googleapis');
const { GOOGLE_CALENDAR_CREDENTIALS } = require('../config/config');

const shareCalendarWithServiceAccount = async () => {
    try {
        console.log("🔐 Setting up calendar sharing...");
        
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(GOOGLE_CALENDAR_CREDENTIALS),
            scopes: ['https://www.googleapis.com/auth/calendar']
        });

        const authClient = await auth.getClient();
        const calendar = google.calendar('v3');

        // Add the service account as a user to your primary calendar
        const rule = {
            role: 'writer', // Can create/edit events
            scope: {
                type: 'user',
                value: 'calendar-api-service-agent@ai-automation-468812.iam.gserviceaccount.com'
            }
        };

        console.log("📅 Adding service account to calendar ACL...");
        const response = await calendar.acl.insert({
            auth: authClient,
            calendarId: 'primary',
            resource: rule
        });

        console.log("✅ Calendar sharing successful!");
        console.log("Service account can now create events in your calendar");
        
    } catch (error) {
        console.log("❌ Error:", error.message);
        
        if (error.message.includes('Forbidden')) {
            console.log("\n🔧 Solution: You need to use YOUR personal Google credentials, not the service account.");
            console.log("1. Go to https://console.developers.google.com/");
            console.log("2. Create OAuth 2.0 credentials for your personal account");
            console.log("3. Use those to authorize calendar sharing");
        }
    }
};

shareCalendarWithServiceAccount();
