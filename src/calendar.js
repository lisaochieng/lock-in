/* Calendar deep-link builders for Google / Yahoo / Outlook / ICS. */

function calendarDateRange(minutes) {
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + minutes * 60 * 1000);
  const format = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return { start: format(startDate), end: format(endDate) };
}

function toIso(value) {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:00Z`;
}

function calendarDuration(minutes) {
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');
  return `${hours}${mins}`;
}

export function calendarEventUrl(provider, roomName, roomLink, minutes) {
  const title = `lock in study session: ${roomName || 'solo focus'}`;
  const details = `join the focus room: ${roomLink}`;
  const { start, end } = calendarDateRange(minutes);
  if (provider === 'yahoo') {
    return `https://calendar.yahoo.com/?v=60&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(details)}&st=${start}&dur=${calendarDuration(minutes)}`;
  }
  if (provider === 'outlook') {
    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(details)}&startdt=${encodeURIComponent(toIso(start))}&enddt=${encodeURIComponent(toIso(end))}`;
  }
  if (provider === 'ics') {
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
      `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${title}`, `DESCRIPTION:${details}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\n');
    return `data:text/calendar;charset=utf8,${encodeURIComponent(ics)}`;
  }
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&dates=${start}/${end}`;
}
