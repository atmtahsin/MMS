/**
 * A short message at the bottom of the screen: "Saved" (green) or an error (red).
 * Screen readers announce it automatically (role "status" or "alert").
 *
 * @param {object} props
 * @param {string} props.text - The message.
 * @param {boolean} [props.isError=false] - Show it in red and announce it urgently.
 */
export function ToastMessage({ text, isError = false }) {
  return (
    <div
      className={`toast no-print${isError ? ' toast--error' : ''}`}
      role={isError ? 'alert' : 'status'}
    >
      {text}
    </div>
  );
}
