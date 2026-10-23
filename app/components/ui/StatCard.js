import { Icon } from './Icon';

/**
 * A headline number with an icon and a caption, e.g. "42 - Active students".
 *
 * @param {object} props
 * @param {string} props.iconName - Icon shown on the left (see Icon.js).
 * @param {string} props.value - The big number or amount, already formatted for display.
 * @param {string} props.label - The caption under the value.
 * @param {boolean} [props.isAlert=false] - Show the value in red (used for money that is still owed).
 */
export function StatCard({ iconName, value, label, isAlert = false }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon">
        <Icon name={iconName} />
      </div>
      <div>
        <strong className={`stat-card-value${isAlert ? ' stat-card-value--alert' : ''}`}>
          {value}
        </strong>
        <span className="stat-card-label">{label}</span>
      </div>
    </div>
  );
}
