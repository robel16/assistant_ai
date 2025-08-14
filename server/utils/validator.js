const logger = require('./logger');

const validateMeetingDetails = (meetingDetails) => {
  // Required fields
  const requiredFields = [
    'action', 'name', 'start', 'end', 
    'attendees', 'duration', 'location'
  ];
  
  // Check required fields
  for (const field of requiredFields) {
    if (!meetingDetails.hasOwnProperty(field)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate field types
  if (typeof meetingDetails.name !== 'string') {
    throw new Error('Meeting name must be a string');
  }

  if(!Array.isArray(meetingDetails.attendees)){
        throw new Error('Attendees must be an array')
    }
    
  if (meetingDetails.attendees.length === 0) {
    throw new Error('At least one attendee is required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const email of meetingDetails.attendees) {
    if (typeof email !== 'string' || !emailRegex.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }
  }

  // Validate dates
  const startDate = new Date(meetingDetails.start);
  const endDate = new Date(meetingDetails.end);
  
  if (isNaN(startDate.getTime())) {
    throw new Error('Invalid start date format');
  }
  
  if (isNaN(endDate.getTime())) {
    throw new Error('Invalid end date format');
  }
  
  if (startDate >= endDate) {
    throw new Error('End date must be after start date');
  }

  // Validate duration
  if (typeof meetingDetails.duration !== 'number' || meetingDetails.duration <= 0) {
    throw new Error('Duration must be a positive number');
  }

  // Validate location
  const validLocations = ['in-person', 'virtual', 'hotel'];
  if (!validLocations.includes(meetingDetails.location)) {
    throw new Error(`Invalid location. Must be one of: ${validLocations.join(', ')}`);
  }

  // Validate action
  const validActions = ['schedule', 'reschedule', 'cancel'];
  if (!validActions.includes(meetingDetails.action)) {
    throw new Error(`Invalid action. Must be one of: ${validActions.join(', ')}`);
  }

  return true;
};

const validateReminderInput = (reminderData) => {
  if (!reminderData.task || typeof reminderData.task !== 'string') {
    throw new Error('Task description is required and must be a string');
  }

  if (!reminderData.dueDate || isNaN(new Date(reminderData.dueDate).getTime())) {
    throw new Error('Valid due date is required');
  }

  if (!reminderData.userId || typeof reminderData.userId !== 'string') {
    throw new Error('User ID is required and must be a string');
  }

  return true;
};

module.exports = { validateMeetingDetails, validateReminderInput };