'use client';

import { useState } from 'react';
import { useAppContext } from '../../AppContext';
import { SimpleRecordPanel } from '../../records/SimpleRecordPanel';
import { WeeklyTimetable } from '../../records/WeeklyTimetable';
import { TabBar } from '../../ui/TabBar';
import { NameListCard } from './NameListCard';

/**
 * Academic screen. Two tabs:
 *   - "Classes & subjects": add and remove the names used in dropdowns across the app
 *   - "Class schedule": the weekly periods, as a table or as a week view that can be printed
 */
export function AcademicScreen() {
  const { translate, canEdit, submitToServer, openPrintSheet, schoolData } = useAppContext();
  const { classNames, subjectNames, schedule } = schoolData;

  // Which tab is open: 'classes' or 'schedule'.
  const [activeTabKey, setActiveTabKey] = useState('classes');
  // The class chosen in the schedule filter; '' means all classes.
  const [selectedClassName, setSelectedClassName] = useState('');
  // Whether the week view is shown below the schedule table.
  const [isWeekViewShown, setIsWeekViewShown] = useState(false);

  const schedulePeriodsToShow = schedule.filter(
    (period) => !selectedClassName || period.class_name === selectedClassName,
  );
  const weekViewTitle = selectedClassName || translate('students.allClasses');

  const classFilterAndViewToggle = (
    <>
      <select
        value={selectedClassName}
        onChange={(changeEvent) => setSelectedClassName(changeEvent.target.value)}
        aria-label={translate('field.class_name')}
      >
        <option value="">{translate('students.allClasses')}</option>
        {classNames.map((className) => (
          <option key={className}>{className}</option>
        ))}
      </select>
      <button
        className="button button--secondary"
        onClick={() => setIsWeekViewShown(!isWeekViewShown)}
      >
        {isWeekViewShown ? translate('academic.hideWeekView') : translate('academic.showWeekView')}
      </button>
    </>
  );

  return (
    <>
      <TabBar
        activeTabKey={activeTabKey}
        onTabChange={setActiveTabKey}
        tabs={[
          { key: 'classes', label: translate('academic.classesAndSubjects') },
          { key: 'schedule', label: translate('recordType.schedule') },
        ]}
      />

      {activeTabKey === 'classes' && (
        <div className="two-column-grid">
          <NameListCard
            title={translate('academic.classes')}
            names={classNames}
            isEditable={canEdit('classes')}
            onAddName={(name) => submitToServer('classes', { name })}
            onRemoveName={(name) => submitToServer('classes/delete', { name })}
          />
          <NameListCard
            title={translate('academic.subjects')}
            names={subjectNames}
            isEditable={canEdit('subjects')}
            onAddName={(name) => submitToServer('subjects', { name })}
            onRemoveName={(name) => submitToServer('subjects/delete', { name })}
          />
        </div>
      )}

      {activeTabKey === 'schedule' && (
        <>
          <SimpleRecordPanel
            recordTypeName="schedule"
            rows={schedulePeriodsToShow}
            extraToolbarControls={classFilterAndViewToggle}
          />
          {isWeekViewShown && (
            <section className="card">
              <div className="card-header">
                <h2>{weekViewTitle}</h2>
                <button
                  className="button button--secondary button--small"
                  onClick={() =>
                    openPrintSheet({
                      kind: 'timetable',
                      title: weekViewTitle,
                      scheduleRows: schedulePeriodsToShow,
                      omittedDetail: 'class',
                    })
                  }
                >
                  {translate('common.print')}
                </button>
              </div>
              <WeeklyTimetable scheduleRows={schedulePeriodsToShow} omittedDetail="class" />
            </section>
          )}
        </>
      )}
    </>
  );
}
