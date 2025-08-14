require("dotenv").config();
const {google} = require('googleapis');
const { GOOGLE_CALENDAR_CREDENTIALS } = require('../config/config');

const debugCalendar = async () => {
    try {
        console.log("🔍 Debugging calendar access...");
        
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(GOOGLE_CALENDAR_CREDENTIALS),
            scopes: ['https://www.googleapis.com/auth/calendar']
        });

        const authClient = await auth.getClient();
        const calendar = google.calendar('v3');

        // 1. List all calendars accessible to service account
        console.log("\n📅 Listing accessible calendars:");
        const calendarList = await calendar.calendarList.list({
            auth: authClient
        });
        
        calendarList.data.items.forEach(cal => {
            console.log(`- ${cal.summary} (${cal.id})`);
        });

        const eventId = "9l2o5mua8e35tolihtfntt5p0c";
        console.log(`\n🔍 Looking for event: ${eventId}`);
        
        for (const cal of calendarList.data.items) {
            try {
                const event = await calendar.events.get({
                    auth: authClient,
                    calendarId: cal.id,
                    eventId: eventId
                });
                
                console.log(`\n✅ Found event in calendar: ${cal.summary} (${cal.id})`);
                console.log(`Event: ${event.data.summary}`);
                console.log(`Start: ${event.data.start.dateTime}`);
                console.log(`End: ${event.data.end.dateTime}`);
                break;
                
            } catch (err) {
                
                continue;
            }
        }

        // 3. List recent events from primary calendar
        console.log("\n📋 Recent events in primary calendar:");
        try {
            const events = await calendar.events.list({
                auth: authClient,
                calendarId: 'primary',
                maxResults: 5,
                orderBy: 'startTime',
                singleEvents: true
            });
            
            events.data.items.forEach(event => {
                console.log(`- ${event.summary} (${event.id})`);
            });
        } catch (error) {
            console.log("❌ Cannot access primary calendar:", error.message);
        }

    } catch (error) {
        console.log("❌ Debug error:", error.message);
    }
};

debugCalendar();
