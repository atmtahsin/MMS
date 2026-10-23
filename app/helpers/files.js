/**
 * Browser helpers for reading and saving files and for shrinking photos.
 */

/**
 * Saves text as a file on the user's device.
 * A byte-order mark is added at the start so Excel shows Bangla (UTF-8) text correctly.
 *
 * @param {string} fileName - The name of the downloaded file, e.g. "invoices.csv".
 * @param {string} text - The file contents.
 * @param {string} mimeType - e.g. "text/csv".
 */
export function downloadTextFile(fileName, text, mimeType) {
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(new Blob(['\ufeff' + text], { type: mimeType }));
  downloadLink.download = fileName;
  downloadLink.click();
  URL.revokeObjectURL(downloadLink.href);
}

/**
 * Reads the text of the file chosen in a file <input>, then clears the input so the
 * same file can be chosen again later.
 *
 * @param {import('react').ChangeEvent<HTMLInputElement>} changeEvent - The input's change event.
 * @param {(fileText: string) => void} onTextRead - Called with the file text (without a byte-order mark).
 */
export function readChosenTextFile(changeEvent, onTextRead) {
  const chosenFile = changeEvent.target.files[0];
  if (!chosenFile) return;
  const fileReader = new FileReader();
  fileReader.onload = () => onTextRead(String(fileReader.result).replace(/^\ufeff/, ''));
  fileReader.readAsText(chosenFile);
  changeEvent.target.value = '';
}

/** The longest side (in pixels) a profile photo is shrunk to before it is saved. */
const MAX_PHOTO_SIDE_IN_PIXELS = 360;

/**
 * Shrinks a chosen image so it is small enough to store in the database.
 *
 * @param {File} imageFile - The image the person picked.
 * @returns {Promise<string>} The image as a compressed JPEG "data:" URL.
 * @throws {Error} If the file cannot be read as an image.
 */
export function shrinkImageToDataUrl(imageFile) {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(imageFile);
    const image = new Image();

    image.onload = () => {
      const scale = Math.min(1, MAX_PHOTO_SIDE_IN_PIXELS / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(imageUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('Unreadable image'));
    };

    image.src = imageUrl;
  });
}
