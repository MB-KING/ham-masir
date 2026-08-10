/** Gathering/meeting time is always 15 minutes before route start. */
export const MEETING_OFFSET_MINUTES = 15;

export function meetingTimeFromStart(startTime: Date) {
  return new Date(startTime.getTime() - MEETING_OFFSET_MINUTES * 60 * 1000);
}
