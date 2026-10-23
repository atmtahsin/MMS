/**
 * A label with a form control (input, select, textarea) inside it.
 * Wrapping the control in the <label> means tapping the text focuses the control.
 *
 * @param {object} props
 * @param {string} props.label - The visible name of the field.
 * @param {import('react').ReactNode} props.children - The control, e.g. <input />.
 * @param {boolean} [props.spansFullWidth=false] - Make the field take the whole row of the form grid.
 */
export function FormField({ label, children, spansFullWidth = false }) {
  return (
    <label className={spansFullWidth ? 'form-field--full' : undefined}>
      {label}
      {children}
    </label>
  );
}
