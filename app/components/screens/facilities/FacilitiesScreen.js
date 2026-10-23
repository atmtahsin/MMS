'use client';

import { useState } from 'react';
import { calculateWeeklyHours } from '../../../helpers/schedule';
import { useAppContext } from '../../AppContext';
import { SimpleRecordPanel } from '../../records/SimpleRecordPanel';
import { WeeklyTimetable } from '../../records/WeeklyTimetable';
import { FormField } from '../../ui/FormField';
import { TabBar } from '../../ui/TabBar';

/**
 * A card holding one dropdown, used to choose a room or a teacher before showing their timetable.
 *
 * @param {object} props
 * @param {string} props.label - The dropdown's label.
 * @param {string} props.value - The currently chosen value ('' = nothing chosen).
 * @param {(newValue: string) => void} props.onChange - Called with the newly chosen value.
 * @param {import('react').ReactNode} props.children - The <option> elements.
 */
function PickerCard({ label, value, onChange, children }) {
  return (
    <div className="card">
      <div className="form-grid">
        <FormField label={label}>
          <select value={value} onChange={(changeEvent) => onChange(changeEvent.target.value)}>
            <option value="" />
            {children}
          </select>
        </FormField>
      </div>
    </div>
  );
}

/**
 * A timetable card with a heading ("Room 101 · 12.5 hrs / week") and a Print button.
 *
 * @param {object} props
 * @param {string} props.title - The room or teacher name.
 * @param {object[]} props.scheduleRows - Their class periods.
 * @param {'room' | 'teacher'} props.omittedDetail - The detail the timetable need not repeat.
 */
function TimetableCard({ title, scheduleRows, omittedDetail }) {
  const { translate, openPrintSheet } = useAppContext();
  return (
    <section className="card">
      <div className="card-header">
        <h2>
          {title} · {calculateWeeklyHours(scheduleRows).toFixed(1)}{' '}
          {translate('schedule.hoursPerWeek')}
        </h2>
        <button
          className="button button--secondary button--small"
          onClick={() => openPrintSheet({ kind: 'timetable', title, scheduleRows, omittedDetail })}
        >
          {translate('common.print')}
        </button>
      </div>
      <WeeklyTimetable scheduleRows={scheduleRows} omittedDetail={omittedDetail} />
    </section>
  );
}

/**
 * Facilities screen. Three tabs: the list of rooms, the timetable of one room,
 * and the timetable of one teacher.
 */
export function FacilitiesScreen() {
  const { translate, schoolData } = useAppContext();
  const { rooms, schedule, staffNames } = schoolData;

  // Which tab is open: 'rooms', 'roomSchedule' or 'teacherSchedule'.
  const [activeTabKey, setActiveTabKey] = useState('rooms');
  // The room chosen in the "Room schedule" tab ('' = none).
  const [selectedRoomName, setSelectedRoomName] = useState('');
  // The teacher chosen in the "Teacher schedule" tab, as text because <select> values are text ('' = none).
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const periodsInSelectedRoom = schedule.filter((period) => period.room_name === selectedRoomName);
  const periodsOfSelectedTeacher = schedule.filter(
    (period) => String(period.teacher_id) === selectedTeacherId,
  );
  const selectedTeacherName = staffNames.find(
    (staffMember) => String(staffMember.id) === selectedTeacherId,
  )?.name;

  return (
    <>
      <TabBar
        activeTabKey={activeTabKey}
        onTabChange={setActiveTabKey}
        tabs={[
          { key: 'rooms', label: translate('recordType.rooms') },
          { key: 'roomSchedule', label: translate('schedule.roomSchedule') },
          { key: 'teacherSchedule', label: translate('schedule.teacherSchedule') },
        ]}
      />

      {activeTabKey === 'rooms' && <SimpleRecordPanel recordTypeName="rooms" rows={rooms} />}

      {activeTabKey === 'roomSchedule' && (
        <>
          <PickerCard
            label={translate('field.room_name')}
            value={selectedRoomName}
            onChange={setSelectedRoomName}
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.name}>
                {room.name}
              </option>
            ))}
          </PickerCard>
          {selectedRoomName && (
            <TimetableCard
              title={selectedRoomName}
              scheduleRows={periodsInSelectedRoom}
              omittedDetail="room"
            />
          )}
        </>
      )}

      {activeTabKey === 'teacherSchedule' && (
        <>
          <PickerCard
            label={translate('field.teacher_id')}
            value={selectedTeacherId}
            onChange={setSelectedTeacherId}
          >
            {staffNames.map((staffMember) => (
              <option key={staffMember.id} value={staffMember.id}>
                {staffMember.name}
              </option>
            ))}
          </PickerCard>
          {selectedTeacherId && (
            <TimetableCard
              title={selectedTeacherName}
              scheduleRows={periodsOfSelectedTeacher}
              omittedDetail="teacher"
            />
          )}
        </>
      )}
    </>
  );
}
