import { ENGLISH_TRANSLATIONS, ENGLISH_SERVER_ERROR_MESSAGES } from './translations.en';
import { BANGLA_TRANSLATIONS, BANGLA_SERVER_ERROR_MESSAGES } from './translations.bn';

/** Languages the interface can be shown in. The first one is the default. */
export const SUPPORTED_LANGUAGES = ['en', 'bn'];

/** The key under which the chosen language is remembered in the browser. */
export const LANGUAGE_STORAGE_KEY = 'madrassa.language';

const TRANSLATIONS_BY_LANGUAGE = {
  en: ENGLISH_TRANSLATIONS,
  bn: BANGLA_TRANSLATIONS,
};

const SERVER_ERRORS_BY_LANGUAGE = {
  en: ENGLISH_SERVER_ERROR_MESSAGES,
  bn: BANGLA_SERVER_ERROR_MESSAGES,
};

/**
 * Builds the `translate` function used by every component.
 *
 * @param {'en' | 'bn'} languageCode - The language the screen is currently shown in.
 * @returns {(translationKey: string) => string} A function that returns the text for a key.
 *   If the key is missing in the chosen language, the English text is used; if it is
 *   missing there too, the key itself is returned so the gap is easy to spot.
 */
export function createTranslator(languageCode) {
  const chosenLanguageTexts = TRANSLATIONS_BY_LANGUAGE[languageCode] ?? ENGLISH_TRANSLATIONS;
  return (translationKey) =>
    chosenLanguageTexts[translationKey] ?? ENGLISH_TRANSLATIONS[translationKey] ?? translationKey;
}

/**
 * Turns an error message from the server into text for the chosen language.
 *
 * The server sometimes appends detail ("Missing or invalid field: name"); only the part
 * before the colon is used to find the translation.
 *
 * @param {'en' | 'bn'} languageCode - The language the screen is currently shown in.
 * @param {string} serverMessage - The `error` text returned by the API.
 * @returns {string} A friendly message, or the original text when there is no translation.
 */
export function translateServerError(languageCode, serverMessage) {
  const lookupKey = serverMessage.startsWith('Missing or invalid field')
    ? 'Missing or invalid field'
    : serverMessage;
  return SERVER_ERRORS_BY_LANGUAGE[languageCode]?.[lookupKey] ?? serverMessage;
}
