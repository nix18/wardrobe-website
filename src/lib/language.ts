export const languages = {
  en: { locale: 'en', name: 'English' },
  zh: { locale: 'zh-CN', name: '简体中文' },
  'zh-hant': { locale: 'zh-Hant', name: '繁體中文' },
  fr: { locale: 'fr', name: 'Français' },
  pt: { locale: 'pt', name: 'Português' },
  es: { locale: 'es', name: 'Español' },
  de: { locale: 'de', name: 'Deutsch' },
  ja: { locale: 'ja', name: '日本語' },
} as const

export type Language = keyof typeof languages

export const countryEndpoint = 'https://api.country.is/'
export const languagePreferenceKey = 'wardrobe-language'

const siteBase = import.meta.env.BASE_URL.replace(/\/$/, '') + '/'

export function isLanguage(value: string | null | undefined): value is Language {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(languages, value)
}

export function pageLanguage(pathname: string): Language {
  const prefix = pathname.slice(siteBase.length).split('/')[0]
  return isLanguage(prefix) ? prefix : 'en'
}

export function localizedBase(language: Language) {
  return language === 'en' ? siteBase : `${siteBase}${language}/`
}

export function languagePath(pathname: string, language: Language) {
  const route = pathname.slice(localizedBase(pageLanguage(pathname)).length)
  if (route === '404.html' || route === '404/') {
    return localizedBase(language) + (language === 'en' ? '404.html' : '404/')
  }
  return localizedBase(language) + route
}
