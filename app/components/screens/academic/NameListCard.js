'use client';

import { useState } from 'react';
import { useAppContext } from '../../AppContext';
import { Icon } from '../../ui/Icon';

/**
 * A card with a list of names (used for classes and subjects) as removable chips,
 * and, for people who may edit, a box to add a new name.
 *
 * @param {object} props
 * @param {string} props.title - The card heading, already translated.
 * @param {string[]} props.names - The names to list.
 * @param {boolean} props.isEditable - Show the add box and the remove buttons.
 * @param {(newName: string) => void} props.onAddName - Called with the trimmed new name.
 * @param {(nameToRemove: string) => void} props.onRemoveName - Called after the person confirms removal.
 */
export function NameListCard({ title, names, isEditable, onAddName, onRemoveName }) {
  const { translate } = useAppContext();
  // The text typed in the "add" box.
  const [newNameText, setNewNameText] = useState('');

  function handleAddSubmit(submitEvent) {
    submitEvent.preventDefault();
    if (newNameText.trim()) onAddName(newNameText.trim());
    setNewNameText('');
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2>{title}</h2>
      </div>

      {isEditable && (
        <form className="toolbar" onSubmit={handleAddSubmit}>
          <input
            aria-label={title}
            value={newNameText}
            onChange={(changeEvent) => setNewNameText(changeEvent.target.value)}
          />
          <button className="button">
            <Icon name="add" size={16} />
            {translate('common.add')}
          </button>
        </form>
      )}

      {names.length === 0 && <div className="empty-state">{translate('common.emptyState')}</div>}

      <div className="chip-list">
        {names.map((name) => (
          <span key={name} className="chip">
            {name}
            {isEditable && (
              <button
                type="button"
                className="chip-remove-button"
                aria-label={`${translate('common.delete')}: ${name}`}
                onClick={() =>
                  window.confirm(translate('common.confirmDelete')) && onRemoveName(name)
                }
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>
    </section>
  );
}
