/**
 * Outline icons, drawn as one SVG path each (24 x 24 grid).
 * To add an icon: add its name and path here, then use <Icon name="yourName" />.
 */
const ICON_PATHS = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  students: 'M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 21c0-4 3.6-7 8-7s8 3 8 7',
  teachers: 'M2 9l10-5 10 5-10 5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5',
  academic: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 19V5M9 7h6M9 11h6',
  accounting: 'M3 6h18v12H3zM3 10h18M7 15h3',
  payroll: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3 2.7-5 6-5s6 2 6 5M17 8h4M17 12h4M17 16h4',
  facilities: 'M3 21V8l9-5 9 5v13M9 21v-6h6v6M8 11h.01M16 11h.01',
  administrative: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  settings:
    'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 00-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 00-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 002 1.2l.4 2.7h4l.4-2.7a7 7 0 002-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 6l12 12M18 6L6 18',
  add: 'M12 5v14M5 12h14',
  signOut: 'M9 21H5V3h4M16 17l5-5-5-5M21 12H9',
  calendar: 'M5 5h14v16H5zM5 10h14M9 3v4M15 3v4',
  money: 'M12 2v20M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  warning: 'M12 3l10 18H2zM12 10v5M12 18h.01',
};

/**
 * A small decorative icon. It is hidden from screen readers, so always put a text label
 * next to it (or an aria-label on the button that contains it).
 *
 * @param {object} props
 * @param {keyof typeof ICON_PATHS} props.name - Which icon to draw. Unknown names show the home icon.
 * @param {number} [props.size=20] - Width and height in pixels.
 */
export function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name] || ICON_PATHS.home} />
    </svg>
  );
}
