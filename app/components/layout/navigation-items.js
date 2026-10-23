import { STUDENT_ROLE, hasPermission } from '../../../lib/permissions';

/**
 * The sidebar menu, in display order. Each item is one screen of the app.
 *
 *   screenKey       unique name of the screen (used to decide which screen to show)
 *   iconName        icon from ui/Icon.js
 *   titleKey        translation key for the menu label and the page title
 *   isVisibleToRole function telling whether a user with that role sees this item
 *                   (the rules live in lib/permissions.js, shared with the server)
 */
export const NAVIGATION_ITEMS = [
  {
    screenKey: 'dashboard',
    iconName: 'home',
    titleKey: 'nav.dashboard',
    isVisibleToRole: (role) => role !== STUDENT_ROLE,
  },
  {
    screenKey: 'students',
    iconName: 'students',
    titleKey: 'nav.students',
    isVisibleToRole: (role) => hasPermission(role, 'students'),
  },
  {
    screenKey: 'teachers',
    iconName: 'teachers',
    titleKey: 'nav.teachers',
    isVisibleToRole: (role) => hasPermission(role, 'teachers'),
  },
  {
    screenKey: 'academic',
    iconName: 'academic',
    titleKey: 'nav.academic',
    isVisibleToRole: (role) => hasPermission(role, 'classes'),
  },
  {
    screenKey: 'accounting',
    iconName: 'accounting',
    titleKey: 'nav.accounting',
    isVisibleToRole: (role) => hasPermission(role, 'accounting'),
  },
  {
    screenKey: 'hrPayroll',
    iconName: 'payroll',
    titleKey: 'nav.hrPayroll',
    isVisibleToRole: (role) => hasPermission(role, 'payroll'),
  },
  {
    screenKey: 'facilities',
    iconName: 'facilities',
    titleKey: 'nav.facilities',
    isVisibleToRole: (role) => hasPermission(role, 'rooms'),
  },
  {
    screenKey: 'administrative',
    iconName: 'administrative',
    titleKey: 'nav.administrative',
    isVisibleToRole: (role) =>
      ['agenda', 'discipline', 'scholarships', 'records'].some((area) => hasPermission(role, area)),
  },
  {
    screenKey: 'settings',
    iconName: 'settings',
    titleKey: 'nav.settings',
    isVisibleToRole: (role) => hasPermission(role, 'settings'),
  },

  // ---- Student portal: the only screens a student / guardian account sees ----
  {
    screenKey: 'portalProfile',
    iconName: 'students',
    titleKey: 'nav.portalProfile',
    isVisibleToRole: (role) => role === STUDENT_ROLE,
  },
  {
    screenKey: 'portalFees',
    iconName: 'accounting',
    titleKey: 'nav.portalFees',
    isVisibleToRole: (role) => role === STUDENT_ROLE,
  },
  {
    screenKey: 'portalTimetable',
    iconName: 'calendar',
    titleKey: 'nav.portalTimetable',
    isVisibleToRole: (role) => role === STUDENT_ROLE,
  },
];
