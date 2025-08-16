const { parseRequest } = require("../services/geminiService");
const { scheduleMeeting } = require("./calendarController");
const { sendConfirmation } = require("./emailController");
const Reminder = require("../models/reminderModel");
const logger = require("../utils/logger");

// Generate meeting links for virtual meetings
const generateMeetingLink = (meetingDetails) => {
	const meetingId = Date.now().toString();
	const meetingDate = new Date(meetingDetails.start);
	const roomName = `${meetingDetails.name.replace(/\s+/g, '-').toLowerCase()}-${meetingId.slice(-6)}`;
	
	// Generate working meeting links
	const providers = {
		jitsi: `https://meet.jit.si/${roomName}`,
		whereby: `https://whereby.com/${roomName}`,
		discord: `https://discord.gg/temp-meeting-${meetingId.slice(-8)}`,
		zoom: `https://zoom.us/j/${meetingId}?pwd=QUFzc3N0YW50MTIz`, // test link for zoom meeting
		teams: `https://teams.microsoft.com/l/meetup-join/meeting-${meetingId}`
	};
	
	// Use Jitsi Meet 
	return providers.jitsi;
};

const processScheduleRequest = async (req, res) => {
	try {
		const { text } = req.body;

		const meetingDetails = await parseRequest(text);

		//schedule meeting
		const event = await scheduleMeeting(meetingDetails);

		//send confirmation email
		await sendConfirmation({
			to: meetingDetails.attendees,
			subject: `Meeting Invitation: ${meetingDetails.name}`,
			text: `You have been invited to a meeting:

Meeting: ${meetingDetails.name}
Date & Time: ${new Date(meetingDetails.start).toLocaleString()}
Duration: ${meetingDetails.duration} minutes
Location: ${meetingDetails.location === 'virtual' ? 'Virtual/Online' : 'In-person'}

Calendar Event ID: ${event.id}
${meetingDetails.location === 'virtual' ? `Meeting Link: ${generateMeetingLink(meetingDetails)}` : 'Location: In-person'}

This meeting was automatically scheduled by AI Executive Assistant.`,
		});

        if(meetingDetails.reminder){
            await Reminder.create({
                task: meetingDetails.name,
                dueDate: meetingDetails.reminder,
                userId: meetingDetails.attendees[0],
                status: 'high'
            })
        }
        res.status(201).json({
            statusCode:201,
            success: true,
            message: "meeting Scheduled successfully",
            eventId: event.id
        })

	} catch (error) {
        console.log(error)
        logger.error(`Error scheduling meeting: ${error.message}`)
        res.status(500).json({
            statusCode:500,
            success: false,
            message: "Internal server error"
        })

    }
};

module.exports = {
    processScheduleRequest
};
