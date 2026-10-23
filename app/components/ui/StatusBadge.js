/**
 * A small rounded label such as "Active" or "Unpaid".
 *
 * @param {object} props
 * @param {'neutral' | 'success' | 'warning' | 'danger'} [props.tone='neutral'] - The colour meaning:
 *   success = good (green), warning = needs attention (amber), danger = problem (red).
 * @param {import('react').ReactNode} props.children - The badge text.
 */
export function StatusBadge({ tone = 'neutral', children }) {
  const toneClassName = tone === 'neutral' ? '' : ` badge--${tone}`;
  return <span className={`badge${toneClassName}`}>{children}</span>;
}
