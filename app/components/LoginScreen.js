'use client';

import { useState } from 'react';
import { callApi } from '../helpers/api-client';
import { Icon } from './ui/Icon';

/** Server message shown to the person as-is (translated) because it explains what to do. */
const TOO_MANY_ATTEMPTS_MESSAGE = 'Too many attempts. Try again later.';

/**
 * The sign-in page shown before anyone is signed in.
 *
 * @param {object} props
 * @param {(translationKey: string) => string} props.translate - The translation function.
 * @param {(serverMessage: string) => string} props.translateServerError - Translates a server error message.
 * @param {() => void} props.onToggleLanguage - Switches between English and Bangla.
 * @param {(user: { username: string, role: string }) => void} props.onSignedIn - Called after a successful sign-in.
 */
export function LoginScreen({ translate, translateServerError, onToggleLanguage, onSignedIn }) {
  // What the person has typed so far.
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  // The message to show under the fields; empty when there is nothing to report.
  const [errorMessage, setErrorMessage] = useState('');
  // True while the request is running, to prevent double submission.
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    setErrorMessage('');
    setIsSigningIn(true);
    try {
      const { user } = await callApi('login', credentials);
      onSignedIn(user);
    } catch (error) {
      // Any failure reads as "wrong username or password", except being rate limited.
      setErrorMessage(
        error.message === TOO_MANY_ATTEMPTS_MESSAGE
          ? translateServerError(error.message)
          : translate('auth.invalidCredentials'),
      );
      setIsSigningIn(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <div className="brand-logo">
            <Icon name="academic" size={22} />
          </div>
          <div>{translate('app.title')}</div>
        </div>

        <h2>{translate('auth.signIn')}</h2>

        <label>
          {translate('auth.username')}
          <input
            autoFocus
            autoComplete="username"
            value={credentials.username}
            onChange={(changeEvent) =>
              setCredentials({ ...credentials, username: changeEvent.target.value })
            }
          />
        </label>

        <label>
          {translate('auth.password')}
          <input
            type="password"
            autoComplete="current-password"
            value={credentials.password}
            onChange={(changeEvent) =>
              setCredentials({ ...credentials, password: changeEvent.target.value })
            }
          />
        </label>

        {errorMessage && (
          <p className="login-error" role="alert">
            {errorMessage}
          </p>
        )}

        <button className="button" disabled={isSigningIn}>
          {translate('auth.signIn')}
        </button>
        <button type="button" className="button button--secondary" onClick={onToggleLanguage}>
          {translate('app.switchLanguageButton')}
        </button>
      </form>
    </div>
  );
}
