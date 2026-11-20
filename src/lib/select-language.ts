import { countryEndpoint, languagePreferenceKey } from './language'

const site = document.documentElement
const current = site.lang === 'zh-CN' ? 'zh' : 'en'
const link = document.querySelector<HTMLAnchorElement>('[data-language-switch]')

function remember(language: string) {
  try { localStorage.setItem(languagePreferenceKey, language) } catch {}
}

function preference() {
  try { return localStorage.getItem(languagePreferenceKey) } catch { return null }
}

function regionLanguage() {
  try { return sessionStorage.getItem(languagePreferenceKey) } catch { return null }
}

function goToOtherLanguage() {
  if (!link) return
  const url = new URL(link.href)
  url.search = location.search
  url.searchParams.delete('lang')
  url.hash = location.hash
  location.replace(url)
}

if (link) {
  const url = new URL(location.href)
  const target = new URL(link.href)
  target.search = url.search
  target.searchParams.set('lang', link.hreflang === 'zh-CN' ? 'zh' : 'en')
  target.hash = url.hash
  link.href = target.href
  link.addEventListener('click', () => {
    remember(link.hreflang === 'zh-CN' ? 'zh' : 'en')
    link.hash = location.hash
  })
  const explicit = url.searchParams.get('lang')
  if (explicit === 'en' || explicit === 'zh') {
    remember(explicit)
    if (explicit !== current) goToOtherLanguage()
  } else if (current === 'en') {
    const saved = preference()
    const detected = regionLanguage()
    if (saved === 'zh' || (saved !== 'en' && detected === 'zh')) {
      goToOtherLanguage()
    } else if (saved !== 'en' && !detected) {
      fetch(countryEndpoint, {
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: AbortSignal.timeout(2000),
      })
        .then(async response => {
          if (!response.ok) return
          const country = (await response.text()).trim().toUpperCase()
          const language = ['CN', 'HK', 'MO', 'TW'].includes(country) ? 'zh' : 'en'
          try { sessionStorage.setItem(languagePreferenceKey, language) } catch {}
          if (language === 'zh' && preference() !== 'en') {
            goToOtherLanguage()
          }
        })
        .catch(() => {})
    }
  }
}
