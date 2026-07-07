/**
 * A value translated into every supported language (see SUPPORTED_LANGUAGES).
 * Stored in the database as a single JSON column shaped `{ en, ru, uz }` and
 * exposed verbatim in API responses (clients pick the language they render).
 */
export interface ITranslation {
  en: string;
  ru: string;
  uz: string;
}
