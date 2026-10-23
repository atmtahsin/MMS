import { Icon } from '../ui/Icon';

/**
 * The dark-green navigation panel. A permanent column on desktop; a slide-in drawer on
 * phones and tablets (opened with the menu button in the top bar).
 *
 * @param {object} props
 * @param {Array<{ screenKey: string, iconName: string, titleKey: string }>} props.visibleItems - Menu items this user may see.
 * @param {string} props.activeScreenKey - The screen currently shown.
 * @param {boolean} props.isOpenOnSmallScreens - Whether the drawer is slid open (ignored on desktop).
 * @param {(screenKey: string) => void} props.onSelectScreen - Called when a menu item is chosen.
 * @param {{ username: string, role: string }} props.signedInUser - Shown at the bottom of the sidebar.
 * @param {() => void} props.onToggleLanguage - Switches between English and Bangla.
 * @param {() => void} props.onSignOut - Ends the session.
 * @param {(translationKey: string) => string} props.translate - The translation function.
 */
export function Sidebar({
  visibleItems,
  activeScreenKey,
  isOpenOnSmallScreens,
  onSelectScreen,
  signedInUser,
  onToggleLanguage,
  onSignOut,
  translate,
}) {
  return (
    <aside className={`sidebar no-print${isOpenOnSmallScreens ? ' sidebar--open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo">
          <Icon name="academic" size={22} />
        </div>
        <div>{translate('app.title')}</div>
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        {visibleItems.map((item) => {
          const isActive = item.screenKey === activeScreenKey;
          return (
            <button
              key={item.screenKey}
              type="button"
              className={`sidebar-nav-item${isActive ? ' sidebar-nav-item--active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelectScreen(item.screenKey)}
            >
              <Icon name={item.iconName} />
              {translate(item.titleKey)}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div>
          {signedInUser.username} ·{' '}
          <span className="sidebar-user-role">{translate(`role.${signedInUser.role}`)}</span>
        </div>
        <div className="button-row">
          <button
            type="button"
            className="button button--secondary button--small"
            onClick={onToggleLanguage}
          >
            {translate('app.switchLanguageButton')}
          </button>
          <button
            type="button"
            className="button button--secondary button--small"
            onClick={onSignOut}
          >
            <Icon name="signOut" size={16} />
            {translate('auth.signOut')}
          </button>
        </div>
      </div>
    </aside>
  );
}
