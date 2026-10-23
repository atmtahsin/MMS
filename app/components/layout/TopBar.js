import { Icon } from '../ui/Icon';

/**
 * The bar above the page: menu button (phones/tablets only), the current screen's title,
 * and a language switch (phones/tablets only - on desktop it lives in the sidebar).
 *
 * @param {object} props
 * @param {string} props.title - The current screen's title, already translated.
 * @param {() => void} props.onOpenMenu - Slides the sidebar drawer open.
 * @param {() => void} props.onToggleLanguage - Switches between English and Bangla.
 * @param {(translationKey: string) => string} props.translate - The translation function.
 */
export function TopBar({ title, onOpenMenu, onToggleLanguage, translate }) {
  return (
    <header className="top-bar no-print">
      <button
        type="button"
        className="button button--secondary menu-button"
        aria-label={translate('common.menu')}
        onClick={onOpenMenu}
      >
        <Icon name="menu" />
      </button>
      <h1 className="top-bar-title">{title}</h1>
      <button
        type="button"
        className="button button--secondary button--small top-bar-language-button"
        onClick={onToggleLanguage}
      >
        {translate('app.switchLanguageButton')}
      </button>
    </header>
  );
}
