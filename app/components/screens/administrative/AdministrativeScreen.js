'use client';

import { useState } from 'react';
import { useAppContext } from '../../AppContext';
import { SimpleRecordPanel } from '../../records/SimpleRecordPanel';
import { TabBar } from '../../ui/TabBar';

/**
 * Administrative screen: one tab per record type the signed-in user may see
 * (school agenda, disciplinary actions, scholarships, administrative records).
 */
export function AdministrativeScreen() {
  const { translate, canView, schoolData } = useAppContext();

  // Every record type on this screen, paired with its rows, filtered to what this user may see.
  const visibleRecordTypes = [
    { recordTypeName: 'agenda', rows: schoolData.agenda },
    { recordTypeName: 'discipline', rows: schoolData.discipline },
    { recordTypeName: 'scholarships', rows: schoolData.scholarships },
    { recordTypeName: 'records', rows: schoolData.records },
  ].filter(({ recordTypeName }) => canView(recordTypeName));

  // The tab that was clicked; if it is not available (or nothing was clicked yet), the first one is used.
  const [clickedTabKey, setClickedTabKey] = useState(visibleRecordTypes[0]?.recordTypeName);
  const activeRecordType =
    visibleRecordTypes.find(({ recordTypeName }) => recordTypeName === clickedTabKey) ||
    visibleRecordTypes[0];

  return (
    <>
      <TabBar
        activeTabKey={activeRecordType.recordTypeName}
        onTabChange={setClickedTabKey}
        tabs={visibleRecordTypes.map(({ recordTypeName }) => ({
          key: recordTypeName,
          label: translate(`recordType.${recordTypeName}`),
        }))}
      />
      <SimpleRecordPanel
        key={activeRecordType.recordTypeName}
        recordTypeName={activeRecordType.recordTypeName}
        rows={activeRecordType.rows}
      />
    </>
  );
}
