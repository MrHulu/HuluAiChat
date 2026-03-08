/**
 * i18n Configuration with Lazy Loading
 * Multi-language support for HuluChat
 *
 * Only loads the current language on startup.
 * Other languages are loaded on-demand when switching.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Supported languages metadata
export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'tl', name: 'Filipino', nativeName: 'Wikang Filipino' },
  { code: 'jv', name: 'Javanese', nativeName: 'Basa Jawa' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Èdè Yorùbá' },
  { code: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'ln', name: 'Lingala', nativeName: 'Lingála' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda' },
  { code: 'ny', name: 'Chichewa', nativeName: 'Chichewa' },
  { code: 'sn', name: 'Shona', nativeName: 'ChiShona' },
  { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo' },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ' },
  { code: 'ff', name: 'Fula', nativeName: 'Fulfulde' },
  { code: 'wo', name: 'Wolof', nativeName: 'Wolof' },
  { code: 'kg', name: 'Kikongo', nativeName: 'Kikongo' },
  { code: 'tn', name: 'Tswana', nativeName: 'Setswana' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa' },
  { code: 'bm', name: 'Bambara', nativeName: 'Bamanankan' },
  { code: 'lg', name: 'Luganda', nativeName: 'Luganda' },
  { code: 'nyn', name: 'Runyankole', nativeName: 'Runyankole' },
  { code: 'ki', name: 'Kikuyu', nativeName: 'Gĩkũyũ' },
  { code: 'ktu', name: 'Kituba', nativeName: 'Kikongo ya leta' },
  { code: 'kr', name: 'Kanuri', nativeName: 'Kanuri' },
  { code: 'lua', name: 'Luba-Kasai', nativeName: 'Tshiluba' },
  { code: 'nus', name: 'Nuer', nativeName: 'Thok Nath' },
  { code: 'din', name: 'Dinka', nativeName: 'Thuɔŋjäŋ' },
  { code: 'luo', name: 'Luo', nativeName: 'Dholuo' },
  { code: 'kam', name: 'Kamba', nativeName: 'Kikamba' },
  { code: 'mas', name: 'Maasai', nativeName: 'ɔl-Maa' },
  { code: 'huk', name: 'Hunde', nativeName: 'Kihunde' },
  { code: 'lol', name: 'Mongo', nativeName: 'Lomongo' },
  { code: 'kbl', name: 'Kanembu', nativeName: 'Kanembu' },
] as const;

export type LanguageCode = typeof supportedLanguages[number]['code'];

// Cache for loaded languages
const loadedLanguages = new Set<string>();

// Dynamic import function for locale files
const importLocale = async (lang: string): Promise<Record<string, unknown>> => {
  const module = await import(`./locales/${lang}.json`);
  return module.default || module;
};

// Load a language on demand
export const loadLanguage = async (lang: string): Promise<boolean> => {
  // Skip if already loaded
  if (loadedLanguages.has(lang)) {
    return true;
  }

  // Validate language code
  const isValidLang = supportedLanguages.some(l => l.code === lang);
  if (!isValidLang) {
    console.warn(`[i18n] Unsupported language: ${lang}`);
    return false;
  }

  try {
    const translations = await importLocale(lang);
    i18n.addResourceBundle(lang, 'translation', translations, true, true);
    loadedLanguages.add(lang);
    console.log(`[i18n] Loaded language: ${lang}`);
    return true;
  } catch (error) {
    console.error(`[i18n] Failed to load language ${lang}:`, error);
    return false;
  }
};

// Get initial language from localStorage or browser
const getInitialLanguage = (): string => {
  // Check localStorage first
  const stored = localStorage.getItem('huluchat-language');
  if (stored && supportedLanguages.some(l => l.code === stored)) {
    return stored;
  }

  // Detect from browser
  const browserLang = navigator.language.split('-')[0];
  if (supportedLanguages.some(l => l.code === browserLang)) {
    return browserLang;
  }

  // Default fallback
  return 'en';
};

// Initialize i18n with lazy loading
const initI18n = async (): Promise<void> => {
  const initialLang = getInitialLanguage();

  // Set HTML lang attribute for screen readers (a11y - Cycle #222)
  document.documentElement.lang = initialLang;

  // Load only the initial language before init
  const initialTranslations = await importLocale(initialLang);
  loadedLanguages.add(initialLang);

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        [initialLang]: { translation: initialTranslations },
      },
      lng: initialLang,
      fallbackLng: 'en',
      debug: false,
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'huluchat-language',
      },
    });

  console.log(`[i18n] Initialized with language: ${initialLang}`);
};

// Change language with lazy loading
export const changeLanguage = async (lang: LanguageCode): Promise<boolean> => {
  const success = await loadLanguage(lang);
  if (success) {
    await i18n.changeLanguage(lang);
    localStorage.setItem('huluchat-language', lang);
    // Update HTML lang attribute for screen readers (a11y - Cycle #222)
    document.documentElement.lang = lang;
    console.log(`[i18n] Changed language to: ${lang}`);
    return true;
  }
  return false;
};

// Export init function
export const initI18nLazy = initI18n;

export default i18n;
