require("dotenv").config();
const {google} = require('googleapis');
const { GOOGLE_CALENDAR_CREDENTIALS } = require('../config/config');

const createSharedCalendar = async () => {
    try {
        console.log("📅 Creating shared calendar for AI Assistant...");
        
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(GOOGLE_CALENDAR_CREDENTIALS),
            scopes: ['https://www.googleapis.com/auth/calendar']
        });

        const authClient = await auth.getClient();
        const calendar = google.calendar('v3');

        
        const newCalendar = {
            summary: 'AI Executive Assistant - Meetings',
            description: 'Calendar for meetings scheduled by AI Executive Assistant',
            timeZone: 'UTC'
        };

        console.log("📝 Creating new calendar...");
        const calendarResponse = await calendar.calendars.insert({
            auth: authClient,
            resource: newCalendar
        });

        const calendarId = calendarResponse.data.id;
        console.log(`✅ Calendar created: ${calendarId}`);

       
        console.log("🔗 Sharing calendar with your email...");
        const rule = {
            role: 'owner', 
            scope: {
                type: 'user',
                value: 'robelmuluwork@gmail.com'
            }
        };

        await calendar.acl.insert({
            auth: authClient,
            calendarId: calendarId,
            resource: rule
        });

        console.log("✅ Calendar shared successfully!");
        console.log(`\n📋 Next steps:`);
        console.log(`1. Update your .env file:`);
        console.log(`   SHARED_CALENDAR_ID=${calendarId}`);
        console.log(`2. Update calendarController.js to use this calendar ID`);
        console.log(`3. Check your Google Calendar - you should see the new shared calendar`);
        
        return calendarId;
        
    } catch (error) {
        console.log("❌ Error:", error.message);
    }
};

createSharedCalendar();
