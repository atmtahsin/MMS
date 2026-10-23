'use client';

import { WEEKDAYS, sortRecordsForDisplay } from '../../../lib/record-types';
import { useAppContext } from '../AppContext';

/**
 * A week view: one small card per weekday listing that day's class periods in time order.
 * Days without any period are left out.
 *
 * @param {object} props
 * @param {Array<object>} props.scheduleRows - The class periods to show (rows of the `schedule` table).
 * @param {'class' | 'teacher' | 'room' | undefined} props.omittedDetail - What this view is already
 *   about. That detail is left out of each period (e.g. a room's timetable does not repeat the room).
 */
export function WeeklyTimetable({ scheduleRows, omittedDetail }) {
  const { translate, schoolData } = useAppContext();
  const sortedPeriods = sortRecordsForDisplay('schedule', scheduleRows);

  if (sortedPeriods.length === 0) {
    return <div className="empty-state">{translate('common.emptyState')}</div>;
  }

  return (
    <div className="timetable">
      {WEEKDAYS.map((weekdayKey) => {
        const periodsOnThisDay = sortedPeriods.filter((period) => period.weekday === weekdayKey);
        if (periodsOnThisDay.length === 0) return null;

        return (
          <div className="timetable-day" key={weekdayKey}>
            <h4 className="timetable-day-title">{translate(`option.${weekdayKey}`)}</h4>
            {periodsOnThisDay.map((period) => {
              const teacherName = schoolData.staffNames.find(
                (staffMember) => staffMember.id === period.teacher_id,
              )?.name;
              // Small print under the subject: class / teacher / room (minus the omitted one).
              const detailTexts = [
                omittedDetail !== 'class' && period.class_name,
                omittedDetail !== 'teacher' && teacherName,
                omittedDetail !== 'room' && period.room_name,
              ].filter(Boolean);

              return (
                <div className="timetable-slot" key={period.id}>
                  <div className="timetable-slot-subject">{period.subject_name}</div>
                  <div className="timetable-slot-time">
                    {period.start_time}–{period.end_time}
                    {detailTexts.length > 0 && ` · ${detailTexts.join(' · ')}`}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
