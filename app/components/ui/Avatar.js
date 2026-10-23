/**
 * A round profile picture. When there is no photo it shows the person's first letter.
 *
 * @param {object} props
 * @param {string} [props.name=''] - The person's name (used for the fallback letter).
 * @param {string} [props.photoDataUrl] - The photo as a "data:image/..." URL, if there is one.
 * @param {'medium' | 'large'} [props.size='medium'] - Medium fits in a table row; large is for profiles.
 */
export function Avatar({ name = '', photoDataUrl, size = 'medium' }) {
  const sizeClassName = size === 'large' ? ' avatar--large' : '';
  return (
    <span className={`avatar${sizeClassName}`} aria-hidden="true">
      {photoDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- the photo is an inline data URL, not a file Next can optimise
        <img src={photoDataUrl} alt="" />
      ) : (
        name.trim().charAt(0).toUpperCase()
      )}
    </span>
  );
}
