import { countryEndpoint, isLanguage, languagePath, languagePreferenceKey, pageLanguage, type Language } from './language'

const url = new URL(location.href)
const current = pageLanguage(url.pathname)
const links = document.querySelectorAll<HTMLAnchorElement>('[data-language-choice]')

const countries: Partial<Record<Language, string[]>> = {
  zh: ['CN'],
  'zh-hant': ['TW', 'HK', 'MO'],
  fr: ['FR', 'MC', 'BF', 'BJ', 'CD', 'CF', 'CG', 'CI', 'GA', 'GN', 'ML', 'NE', 'SN', 'TD', 'TG'],
  pt: ['PT', 'BR', 'AO', 'CV', 'GW', 'MZ', 'ST', 'TL'],
  de: ['DE', 'AT', 'LI'],
  ja: ['JP'],
  es: ['AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'ES', 'GQ', 'GT', 'HN', 'MX', 'NI', 'PA', 'PE', 'PY', 'SV', 'UY', 'VE'],
}

function stored(key: string, persistent = false) {
  try {
    return (persistent ? localStorage : sessionStorage).getItem(key)
  } catch {
    return null
  }
}

function save(key: string, language: Language, persistent = false) {
  try {
    (persistent ? localStorage : sessionStorage).setItem(key, language)
  } catch {}
}

function preferred() {
  const language = stored(languagePreferenceKey, true) ?? stored(languagePreferenceKey)
  return isLanguage(language) ? language : null
}

function remember(language: Language) {
  save(languagePreferenceKey, language, true)
  save(languagePreferenceKey, language)
}

function clearPreference() {
  for (const storage of ['localStorage', 'sessionStorage'] as const) {
    try {
      window[storage].removeItem(languagePreferenceKey)
    } catch {}
  }
}

function withLanguage(language: Language) {
  const target = new URL(location.href)
  target.pathname = languagePath(target.pathname, language)
  return target
}

function navigate(language: Language) {
  if (language === current) return
  const target = withLanguage(language)
  target.searchParams.delete('lang')
  location.replace(target)
}

async function detectRegion() {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 3500)
  try {
    const response = await fetch(countryEndpoint, {
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    })
    if (!response.ok) return 'en'
    const result: { country?: unknown } = await response.json()
    const country = typeof result?.country === 'string' ? result.country.trim().toUpperCase() : ''
    const browserLanguage = navigator.language.toLowerCase().split('-')[0]
    if (['BE', 'CA', 'CH', 'LU'].includes(country) && browserLanguage === 'fr') return 'fr'
    if (['BE', 'CH', 'LU'].includes(country) && browserLanguage === 'de') return 'de'
    return (Object.keys(countries) as Language[]).find(language => countries[language]?.includes(country)) ?? 'en'
  } catch {
    return 'en'
  } finally {
    window.clearTimeout(timeout)
  }
}

for (const link of links) {
  const choice = link.dataset.languageChoice
  if (choice !== 'auto' && !isLanguage(choice)) continue
  const target = withLanguage(choice === 'auto' ? 'en' : choice)
  target.searchParams.set('lang', choice)
  link.href = target.href
  link.addEventListener('click', () => {
    if (choice !== 'auto') remember(choice)
    link.hash = location.hash
  })
}

const explicit = url.searchParams.get('lang')
if (isLanguage(explicit)) {
  remember(explicit)
  navigate(explicit)
} else if (explicit === 'auto' || current === 'en') {
  if (explicit === 'auto') {
    clearPreference()
    url.searchParams.delete('lang')
    history.replaceState(history.state, '', url)
  }
  const selected = preferred()
  if (selected) {
    navigate(selected)
  } else {
    void detectRegion().then(language => {
      if (!preferred()) navigate(language)
    })
  }
}
