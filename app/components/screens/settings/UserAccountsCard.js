'use client';

import { useState } from 'react';
import { ALL_ROLES, STUDENT_ROLE } from '../../../../lib/permissions';
import { useAppContext } from '../../AppContext';
import { FormField } from '../../ui/FormField';

/** What the "add user" form holds when it is empty. New accounts start as registrars. */
const BLANK_USER_FORM = { username: '', password: '', role: 'registrar', family_id: '' };

/**
 * Admin-only card for managing sign-in accounts: a form to add a user (or reset a password by
 * saving the same username again) and a list of existing users with a remove button.
 * Student / guardian accounts are linked to a Family ID and can only use the student portal.
 */
export function UserAccountsCard() {
  const { translate, submitToServer, schoolData } = useAppContext();

  // The values typed into the "add user" form.
  const [userForm, setUserForm] = useState(BLANK_USER_FORM);

  // Every Family ID that exists, with a guardian's name to make the right one easy to pick.
  const familyChoices = [
    ...new Map(
      schoolData.students.map((student) => [student.family_id, student.guardian_name]),
    ).entries(),
  ];
  const isStudentAccount = userForm.role === STUDENT_ROLE;

  function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    // After saving, clear the name and password but keep the chosen role for the next user.
    submitToServer('users', userForm, () =>
      setUserForm({ ...userForm, username: '', password: '', family_id: '' }),
    );
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2>{translate('settings.users')}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <FormField label={translate('auth.username')}>
            <input
              required
              value={userForm.username}
              onChange={(changeEvent) =>
                setUserForm({ ...userForm, username: changeEvent.target.value })
              }
            />
          </FormField>
          <FormField label={translate('auth.passwordHint')}>
            <input
              required
              type="password"
              autoComplete="new-password"
              value={userForm.password}
              onChange={(changeEvent) =>
                setUserForm({ ...userForm, password: changeEvent.target.value })
              }
            />
          </FormField>
          <FormField label={translate('settings.userRole')}>
            <select
              value={userForm.role}
              onChange={(changeEvent) =>
                setUserForm({ ...userForm, role: changeEvent.target.value })
              }
            >
              {ALL_ROLES.map((role) => (
                <option key={role} value={role}>
                  {translate(`role.${role}`)}
                </option>
              ))}
            </select>
          </FormField>
          {isStudentAccount && (
            <FormField label={translate('settings.familyIdForStudentAccount')}>
              <select
                required
                value={userForm.family_id}
                onChange={(changeEvent) =>
                  setUserForm({ ...userForm, family_id: changeEvent.target.value })
                }
              >
                <option value="" />
                {familyChoices.map(([familyId, guardianName]) => (
                  <option key={familyId} value={familyId}>
                    {familyId} · {guardianName}
                  </option>
                ))}
              </select>
            </FormField>
          )}
        </div>
        <button className="button form-actions">{translate('settings.saveUser')}</button>
      </form>

      <div className="chip-list">
        {schoolData.users.map((user) => (
          <span key={user.username} className="chip">
            {user.username} · {translate(`role.${user.role}`)}
            {user.family_id && ` (${user.family_id})`}
            <button
              type="button"
              className="chip-remove-button"
              aria-label={`${translate('common.delete')}: ${user.username}`}
              onClick={() =>
                window.confirm(`${translate('common.delete')}: ${user.username}?`) &&
                submitToServer('users/delete', { username: user.username })
              }
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </section>
  );
}
