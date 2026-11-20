export type Language = 'en' | 'zh'

export const countryEndpoint = 'https://ipapi.co/country/'
export const languagePreferenceKey = 'wardrobe-language'

const siteBase = import.meta.env.BASE_URL.replace(/\/$/, '') + '/'

export function pageLanguage(pathname: string): Language {
  const path = pathname.slice(siteBase.length)
  return path === 'zh' || path.startsWith('zh/') ? 'zh' : 'en'
}

export function localizedBase(language: Language) {
  return language === 'zh' ? siteBase + 'zh/' : siteBase
}

export function languagePath(pathname: string, language: Language) {
  const route = pathname.slice(localizedBase(pageLanguage(pathname)).length)
  if (route === '404.html' || route === '404/') {
    return localizedBase(language) + (language === 'zh' ? '404/' : '404.html')
  }
  return localizedBase(language) + route
}

export function translations(pathname: string) {
  const language = pageLanguage(pathname)
  return {
    language,
    base: localizedBase(language),
    t: (en: string, zh: string) => language === 'zh' ? zh : en,
    locale: language === 'zh' ? 'zh-CN' : 'en',
  }
}
