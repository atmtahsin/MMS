'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { callApi } from '../helpers/api-client';
import { createFormatters } from '../helpers/formatting';
import { createTranslator, translateServerError, LANGUAGE_STORAGE_KEY } from '../i18n';
import { hasPermission } from '../../lib/permissions';
import { AppContext } from './AppContext';
import { LoginScreen } from './LoginScreen';
import { Sidebar } from './layout/Sidebar';
import { TopBar } from './layout/TopBar';
import { ToastMessage } from './layout/ToastMessage';
import { NAVIGATION_ITEMS } from './layout/navigation-items';
import { PrintableSheet } from './print/PrintableSheet';
import { DashboardScreen } from './screens/dashboard/DashboardScreen';
import { StudentsScreen } from './screens/students/StudentsScreen';
import { TeachersScreen } from './screens/teachers/TeachersScreen';
import { AcademicScreen } from './screens/academic/AcademicScreen';
import { AccountingScreen } from './screens/accounting/AccountingScreen';
import { HrPayrollScreen } from './screens/hr-payroll/HrPayrollScreen';
import { FacilitiesScreen } from './screens/facilities/FacilitiesScreen';
import { AdministrativeScreen } from './screens/administrative/AdministrativeScreen';
import { SettingsScreen } from './screens/settings/SettingsScreen';
import { PortalProfileScreen } from './screens/portal/PortalProfileScreen';
import { PortalFeesScreen } from './screens/portal/PortalFeesScreen';
import { PortalTimetableScreen } from './screens/portal/PortalTimetableScreen';

/** What the screens receive before the first load finishes (or after signing out). */
const EMPTY_SCHOOL_DATA = {
  students: [],
  teachers: [],
  staffNames: [],
  feeTypes: [],
  invoices: [],
  payrollLines: [],
  classNames: [],
  subjectNames: [],
  rooms: [],
  schedule: [],
  agenda: [],
  discipline: [],
  scholarships: [],
  records: [],
  users: [],
  auditLog: [],
};

/** How long a toast stays on screen, in milliseconds. Errors stay longer so they can be read. */
const SUCCESS_TOAST_DURATION_MS = 2200;
const ERROR_TOAST_DURATION_MS = 6000;

/**
 * The whole application: it checks who is signed in, loads the school's data,
 * shows the sidebar + the chosen screen, and provides shared values through AppContext.
 */
export function MadrassaApp() {
  // 'en' or 'bn'. Starts as English; the saved choice is applied right after the first render.
  const [languageCode, setLanguageCode] = useState('en');
  // undefined = still checking the session, null = nobody signed in, otherwise { username, role }.
  const [signedInUser, setSignedInUser] = useState(undefined);
  // Everything loaded from the server (students, invoices, ...).
  const [schoolData, setSchoolData] = useState(EMPTY_SCHOOL_DATA);
  // Which screen is open, e.g. 'dashboard' or 'students'. Empty = the first screen this user may see
  // (the dashboard for staff, "My profile" for student / guardian accounts).
  const [activeScreenKey, setActiveScreenKey] = useState('');
  // Whether the sidebar drawer is slid open (phones and tablets only).
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // The message at the bottom of the screen: { text, isError } or null when nothing is shown.
  const [toast, setToast] = useState(null);
  // The document in the print preview ({ kind, ... }, see PrintableSheet.js) or null when closed.
  const [printSheet, setPrintSheet] = useState(null);

  const translate = useMemo(() => createTranslator(languageCode), [languageCode]);
  const { formatMoney, formatDate } = useMemo(() => createFormatters(languageCode), [languageCode]);

  /* ---------------------------- language ---------------------------- */

  function changeLanguage(newLanguageCode) {
    setLanguageCode(newLanguageCode);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguageCode);
  }

  const toggleLanguage = () => changeLanguage(languageCode === 'en' ? 'bn' : 'en');

  /* ----------------------------- toasts ----------------------------- */

  const showToast = (text, isError = false) => setToast({ text, isError });

  /** Shows an error toast, using a translation of the server's message when one exists. */
  const showErrorToast = (serverMessage) =>
    showToast(translateServerError(languageCode, serverMessage), true);

  // Hide the toast automatically after a few seconds.
  useEffect(() => {
    if (!toast) return undefined;
    const hideTimer = setTimeout(
      () => setToast(null),
      toast.isError ? ERROR_TOAST_DURATION_MS : SUCCESS_TOAST_DURATION_MS,
    );
    return () => clearTimeout(hideTimer);
  }, [toast]);

  /* ------------------------------ data ------------------------------ */

  const reloadSchoolData = useCallback(async () => {
    setSchoolData(await callApi('data'));
  }, []);

  /**
   * Sends one change to the server, reloads all data, shows "Saved" and then runs `onSuccess`
   * (for example to close the form). If the server refuses, an error toast is shown instead.
   */
  async function submitToServer(routePath, requestBody, onSuccess) {
    try {
      await callApi(routePath, requestBody);
      await reloadSchoolData();
      showToast(translate('common.saved'));
      if (onSuccess) onSuccess();
    } catch (error) {
      showErrorToast(error.message);
    }
  }

  /* ------------------------ start-up and session ------------------------ */

  useEffect(() => {
    // Restore the language chosen last time (also reading the key older versions used).
    const savedLanguage = (
      localStorage.getItem(LANGUAGE_STORAGE_KEY) ||
      localStorage.getItem('mms.lang') ||
      ''
    ).replace(/"/g, '');
    setLanguageCode(savedLanguage === 'bn' ? 'bn' : 'en');

    // Find out whether a valid session already exists (the person may just have refreshed).
    callApi('me')
      .then(({ user }) => {
        setSignedInUser(user);
        if (user) reloadSchoolData();
      })
      .catch(() => setSignedInUser(null));
  }, [reloadSchoolData]);

  // Keep the page's <html lang> in step with the chosen language (helps screen readers).
  useEffect(() => {
    document.documentElement.lang = languageCode;
  }, [languageCode]);

  // Let the Escape key close the sidebar drawer.
  useEffect(() => {
    if (!isSidebarOpen) return undefined;
    const closeOnEscapeKey = (keyboardEvent) => {
      if (keyboardEvent.key === 'Escape') setIsSidebarOpen(false);
    };
    document.addEventListener('keydown', closeOnEscapeKey);
    return () => document.removeEventListener('keydown', closeOnEscapeKey);
  }, [isSidebarOpen]);

  async function signOut() {
    await callApi('logout', {});
    setSignedInUser(null);
    setSchoolData(EMPTY_SCHOOL_DATA);
  }

  function handleSignedIn(user) {
    setSignedInUser(user);
    setActiveScreenKey('');
    reloadSchoolData();
  }

  /* ---------------------------- rendering ---------------------------- */

  // Still checking the session: show nothing rather than flashing the login page.
  if (signedInUser === undefined) return null;

  if (!signedInUser) {
    return (
      <LoginScreen
        translate={translate}
        translateServerError={(serverMessage) => translateServerError(languageCode, serverMessage)}
        onToggleLanguage={toggleLanguage}
        onSignedIn={handleSignedIn}
      />
    );
  }

  const userRole = signedInUser.role;
  const visibleNavigationItems = NAVIGATION_ITEMS.filter((item) => item.isVisibleToRole(userRole));
  // If the remembered screen is not allowed for this user, fall back to their first screen.
  const shownScreenKey = visibleNavigationItems.some((item) => item.screenKey === activeScreenKey)
    ? activeScreenKey
    : visibleNavigationItems[0].screenKey;
  const shownScreenTitle = translate(
    NAVIGATION_ITEMS.find((item) => item.screenKey === shownScreenKey).titleKey,
  );

  function goToScreen(screenKey) {
    setActiveScreenKey(screenKey);
    setIsSidebarOpen(false); // close the drawer on phones
    window.scrollTo(0, 0);
  }

  const appContextValue = {
    languageCode,
    translate,
    userRole,
    canView: (permissionArea) => hasPermission(userRole, permissionArea, 'view'),
    canEdit: (permissionArea) => hasPermission(userRole, permissionArea, 'edit'),
    submitToServer,
    showErrorToast,
    formatMoney,
    formatDate,
    schoolData,
    openPrintSheet: setPrintSheet,
  };

  return (
    <AppContext.Provider value={appContextValue}>
      <div className="app-layout">
        <Sidebar
          visibleItems={visibleNavigationItems}
          activeScreenKey={shownScreenKey}
          isOpenOnSmallScreens={isSidebarOpen}
          onSelectScreen={goToScreen}
          signedInUser={signedInUser}
          onToggleLanguage={toggleLanguage}
          onSignOut={signOut}
          translate={translate}
        />
        <div
          className={`sidebar-backdrop no-print${isSidebarOpen ? ' sidebar-backdrop--visible' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
        />

        <div className="main-column">
          <TopBar
            title={shownScreenTitle}
            onOpenMenu={() => setIsSidebarOpen(true)}
            onToggleLanguage={toggleLanguage}
            translate={translate}
          />
          <main className="page-content no-print">
            {shownScreenKey === 'dashboard' && <DashboardScreen />}
            {shownScreenKey === 'students' && <StudentsScreen />}
            {shownScreenKey === 'teachers' && <TeachersScreen />}
            {shownScreenKey === 'academic' && <AcademicScreen />}
            {shownScreenKey === 'accounting' && <AccountingScreen />}
            {shownScreenKey === 'hrPayroll' && <HrPayrollScreen />}
            {shownScreenKey === 'facilities' && <FacilitiesScreen />}
            {shownScreenKey === 'administrative' && <AdministrativeScreen />}
            {shownScreenKey === 'settings' && <SettingsScreen />}
            {shownScreenKey === 'portalProfile' && <PortalProfileScreen />}
            {shownScreenKey === 'portalFees' && <PortalFeesScreen />}
            {shownScreenKey === 'portalTimetable' && <PortalTimetableScreen />}
          </main>
        </div>

        {printSheet && <PrintableSheet sheet={printSheet} onClose={() => setPrintSheet(null)} />}
        {toast && <ToastMessage text={toast.text} isError={toast.isError} />}
      </div>
    </AppContext.Provider>
  );
}
