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

const regionKey = languagePreferenceKey + '-region'

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
  try {
    const response = await fetch(countryEndpoint, {
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(2000),
    })
    if (!response.ok) return 'en'
    const country = (await response.text()).trim().toUpperCase()
    const browserLanguage = navigator.language.toLowerCase().split('-')[0]
    if (['BE', 'CA', 'CH', 'LU'].includes(country) && browserLanguage === 'fr') return 'fr'
    if (['BE', 'CH', 'LU'].includes(country) && browserLanguage === 'de') return 'de'
    return (Object.keys(countries) as Language[]).find(language => countries[language]?.includes(country)) ?? 'en'
  } catch {
    return 'en'
  }
}

for (const link of links) {
  const language = link.dataset.languageChoice
  if (!isLanguage(language)) continue
  const target = withLanguage(language)
  target.searchParams.set('lang', language)
  link.href = target.href
  link.addEventListener('click', () => {
    remember(language)
    link.hash = location.hash
  })
}

const explicit = url.searchParams.get('lang')
if (isLanguage(explicit)) {
  remember(explicit)
  navigate(explicit)
} else if (current === 'en') {
  const selected = preferred()
  const detected = stored(regionKey)
  if (selected) {
    navigate(selected)
  } else if (isLanguage(detected)) {
    navigate(detected)
  } else {
    void detectRegion().then(language => {
      save(regionKey, language)
      if (!preferred()) navigate(language)
    })
  }
}
