/**
 * A small "label above value" pair used in profile pop-ups, e.g. "Blood group / B+".
 * Renders nothing when there is no value, so empty fields do not leave gaps.
 *
 * @param {object} props
 * @param {string} props.label - The field name, already translated.
 * @param {import('react').ReactNode} [props.value] - The value to show; falsy values hide the whole item.
 */
export function DetailItem({ label, value }) {
  if (!value) return null;
  return (
    <div className="detail-item">
      <div className="detail-item-label">{label}</div>
      <p className="detail-item-value">{value}</p>
    </div>
  );
}
