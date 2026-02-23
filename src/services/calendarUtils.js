/**
 * Calendar Utilities
 * 
 * Helpers for generating calendar event links (Google Calendar, Outlook, ICS)
 * Used for adding coaching sessions to calendars and notifying facilitators.
 */

/**
 * Format date for calendar URLs (YYYYMMDDTHHMMSSZ)
 */
const formatCalendarDate = (date) => {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

/**
 * Generate Google Calendar URL for an event
 */
export const generateGoogleCalendarUrl = ({
  title,
  description,
  location,
  startDate,
  endDate,
  startTime,
  durationMinutes = 60
}) => {
  // Parse date and time
  let start = new Date(startDate);
  if (startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    start.setHours(hours, minutes, 0, 0);
  }
  
  // Calculate end time
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description || '',
    location: location || '',
    dates: `${formatCalendarDate(start)}/${formatCalendarDate(end)}`
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate Outlook Web Calendar URL for an event
 */
export const generateOutlookCalendarUrl = ({
  title,
  description,
  location,
  startDate,
  startTime,
  durationMinutes = 60
}) => {
  let start = new Date(startDate);
  if (startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    start.setHours(hours, minutes, 0, 0);
  }
  
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    body: description || '',
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    location: location || ''
  });
  
  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
};

/**
 * Generate ICS file content for downloading
 */
export const generateICSContent = ({
  title,
  description,
  location,
  startDate,
  startTime,
  durationMinutes = 60,
  uid
}) => {
  let start = new Date(startDate);
  if (startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    start.setHours(hours, minutes, 0, 0);
  }
  
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const now = new Date();
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LeaderReps//Coaching Session//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid || `${Date.now()}@leaderreps.com`}`,
    `DTSTAMP:${formatCalendarDate(now)}`,
    `DTSTART:${formatCalendarDate(start)}`,
    `DTEND:${formatCalendarDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${(description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${location || ''}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icsContent;
};

/**
 * Download ICS file
 */
export const downloadICSFile = (eventData, filename = 'event.ics') => {
  const content = generateICSContent(eventData);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate calendar links for a coaching session registration
 * Returns object with Google, Outlook, and ICS download links
 */
export const generateSessionCalendarLinks = (session, registration) => {
  const eventData = {
    title: `[LeaderReps] ${session.title} - ${registration.userName || 'Participant'}`,
    description: `Coaching session with ${registration.userName || registration.userEmail}\n\nSession Type: ${session.sessionType || 'Coaching'}\nParticipant Email: ${registration.userEmail}\n\nMilestone: ${registration.coachingItemId || 'N/A'}`,
    location: session.location || 'Virtual',
    startDate: session.date,
    startTime: session.time,
    durationMinutes: session.durationMinutes || 60,
    uid: `${session.id}-${registration.userId}@leaderreps.com`
  };
  
  return {
    google: generateGoogleCalendarUrl(eventData),
    outlook: generateOutlookCalendarUrl(eventData),
    ics: eventData, // Pass data for ICS download
    downloadICS: () => downloadICSFile(eventData, `coaching-${session.id}.ics`)
  };
};

/**
 * Generate facilitator notification email content
 * This can be used with a cloud function to send email notifications
 */
export const generateFacilitatorNotificationContent = (session, registration, action = 'registered') => {
  const actionText = {
    registered: 'has registered for',
    cancelled: 'has cancelled their registration for',
    switched: 'has switched to'
  };
  
  return {
    subject: `[LeaderReps] ${registration.userName || 'A participant'} ${actionText[action] || 'updated'} ${session.title}`,
    body: `
${registration.userName || 'A participant'} ${actionText[action] || 'has updated their registration for'} your coaching session.

Session Details:
- Title: ${session.title}
- Date: ${session.date}
- Time: ${session.time}
- Session Type: ${session.sessionType || 'Coaching'}

Participant Details:
- Name: ${registration.userName || 'Not provided'}
- Email: ${registration.userEmail}
${registration.coachingItemId ? `- Milestone Action: ${registration.coachingItemId}` : ''}

Add to your calendar:
- Google Calendar: ${generateGoogleCalendarUrl({
      title: `${session.title} - ${registration.userName}`,
      description: `Coaching session with ${registration.userName}`,
      startDate: session.date,
      startTime: session.time,
      durationMinutes: session.durationMinutes || 60
    })}

---
This is an automated notification from LeaderReps.
    `.trim(),
    html: `
<h2>Coaching Session ${action === 'cancelled' ? 'Cancellation' : 'Registration'}</h2>
<p><strong>${registration.userName || 'A participant'}</strong> ${actionText[action] || 'has updated their registration for'} your coaching session.</p>

<h3>Session Details</h3>
<ul>
  <li><strong>Title:</strong> ${session.title}</li>
  <li><strong>Date:</strong> ${session.date}</li>
  <li><strong>Time:</strong> ${session.time}</li>
  <li><strong>Type:</strong> ${session.sessionType || 'Coaching'}</li>
</ul>

<h3>Participant Details</h3>
<ul>
  <li><strong>Name:</strong> ${registration.userName || 'Not provided'}</li>
  <li><strong>Email:</strong> ${registration.userEmail}</li>
  ${registration.coachingItemId ? `<li><strong>Milestone:</strong> ${registration.coachingItemId}</li>` : ''}
</ul>

<p><a href="${generateGoogleCalendarUrl({
      title: `${session.title} - ${registration.userName}`,
      description: `Coaching session with ${registration.userName}`,
      startDate: session.date,
      startTime: session.time,
      durationMinutes: session.durationMinutes || 60
    })}">Add to Google Calendar</a></p>

<hr>
<p style="color: #666; font-size: 12px;">This is an automated notification from LeaderReps.</p>
    `.trim()
  };
};

export default {
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  generateICSContent,
  downloadICSFile,
  generateSessionCalendarLinks,
  generateFacilitatorNotificationContent
};
