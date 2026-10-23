'use client';

import { useEffect } from 'react';
import { Icon } from './Icon';

/**
 * A pop-up dialog. It closes when the person presses Escape, taps the dim area outside it,
 * or presses the close button, and it stops the page behind from scrolling while open.
 * On phones it slides up as a bottom sheet; on larger screens it is centred.
 *
 * @param {object} props
 * @param {string} props.title - The dialog heading (also its accessible name).
 * @param {() => void} props.onClose - Called when the dialog should close.
 * @param {string} props.closeButtonLabel - Accessible name of the "X" button, already translated.
 * @param {boolean} [props.isWide=false] - Use a wider dialog (for profiles and tables).
 * @param {import('react').ReactNode} props.children - The dialog contents.
 */
export function ModalDialog({ title, onClose, closeButtonLabel, isWide = false, children }) {
  useEffect(() => {
    const closeOnEscapeKey = (keyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscapeKey);

    // Lock page scrolling behind the dialog, and restore it afterwards.
    const originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', closeOnEscapeKey);
      document.body.style.overflow = originalBodyOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(mouseEvent) => {
        // Only a press on the dim backdrop itself closes the dialog, not a press inside it.
        if (mouseEvent.target === mouseEvent.currentTarget) onClose();
      }}
    >
      <div
        className={`modal${isWide ? ' modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal-header">
          <h3>{title}</h3>
          <button
            type="button"
            className="button button--secondary button--small"
            onClick={onClose}
            aria-label={closeButtonLabel}
          >
            <Icon name="close" size={16} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
