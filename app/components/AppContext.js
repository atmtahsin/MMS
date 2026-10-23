'use client';

import { createContext, useContext } from 'react';

/**
 * AppContext carries everything that most screens need, so it does not have to be passed
 * down through every component as a prop.
 *
 * The value (created in MadrassaApp.js) contains:
 *   - languageCode        'en' or 'bn'
 *   - translate(key)      returns the interface text for a translation key
 *   - userRole            'admin', 'registrar' or 'accounts'
 *   - canView(area)       true when the signed-in user may look at that area (see lib/permissions.js)
 *   - canEdit(area)       true when the signed-in user may change that area
 *   - submitToServer(routePath, requestBody, onSuccess)
 *                         sends a change to the API, reloads all data, shows "Saved",
 *                         then runs onSuccess. Errors are shown as a toast.
 *   - showErrorToast(message)   shows a red message at the bottom of the screen
 *   - formatMoney(amount), formatDate(isoDate)   display formatters for the chosen language
 *   - schoolData          every list loaded from the server (students, teachers, invoices ...)
 *   - openPrintSheet(sheet)     opens the print preview (see PrintableSheet.js)
 */
export const AppContext = createContext(null);

/** Reads the shared app values. Must be called inside <MadrassaApp />. */
export function useAppContext() {
  const appContextValue = useContext(AppContext);
  if (!appContextValue) {
    throw new Error('useAppContext must be used inside <AppContext.Provider>');
  }
  return appContextValue;
}
