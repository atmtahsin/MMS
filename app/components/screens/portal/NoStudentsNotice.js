'use client';

import { useAppContext } from '../../AppContext';

/** Shown when a portal account has no students (for example, the family's students were removed). */
export function NoStudentsNotice() {
  const { translate } = useAppContext();
  return <div className="card empty-state">{translate('portal.noStudentsLinked')}</div>;
}
