/**
 * A row of pill-shaped tabs for switching between views of the same screen.
 *
 * @param {object} props
 * @param {Array<{ key: string, label: string }>} props.tabs - The tabs, in order.
 * @param {string} props.activeTabKey - The `key` of the tab that is currently selected.
 * @param {(tabKey: string) => void} props.onTabChange - Called with the clicked tab's key.
 */
export function TabBar({ tabs, activeTabKey, onTabChange }) {
  return (
    <div className="tab-bar" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTabKey;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`tab-button${isActive ? ' tab-button--active' : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
