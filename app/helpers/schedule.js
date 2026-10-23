/** "08:30" -> 510 (minutes since midnight). */
function timeToMinutes(timeText) {
  return Number(timeText.slice(0, 2)) * 60 + Number(timeText.slice(3, 5));
}

/**
 * Total teaching hours per week in a list of schedule rows.
 *
 * @param {Array<{ start_time: string, end_time: string }>} scheduleRows
 * @returns {number} Hours, possibly fractional (e.g. 7.5).
 */
export function calculateWeeklyHours(scheduleRows) {
  return scheduleRows.reduce(
    (totalHours, period) =>
      totalHours + (timeToMinutes(period.end_time) - timeToMinutes(period.start_time)) / 60,
    0,
  );
}
