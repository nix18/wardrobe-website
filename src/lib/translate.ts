import german from '../data/translations/de.json'
import japanese from '../data/translations/ja.json'
import spanish from '../data/translations/es.json'
import french from '../data/translations/fr.json'
import portuguese from '../data/translations/pt.json'
import traditional from '../data/translations/zh-hant.json'
import { languages, localizedBase, pageLanguage, type Language } from './language'

const messages: Partial<Record<Language, Record<string, string>>> = {
  de: german,
  es: spanish,
  ja: japanese,
  fr: french,
  pt: portuguese,
  'zh-hant': traditional,
}

export function translations(pathname: string) {
  const language = pageLanguage(pathname)
  return {
    language,
    base: localizedBase(language),
    locale: languages[language].locale,
    t(en: string, zh: string, values?: Record<string, string | number>) {
      const source = language === 'zh' || language === 'zh-hant' ? zh : en
      const message = messages[language]?.[source] ?? source
      return values ? message.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`)) : message
    },
  }
}
