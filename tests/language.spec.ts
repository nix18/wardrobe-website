import { expect, test } from '@playwright/test'

const countryEndpoint = 'https://api.country.is/'

test('locates visitors by country and preserves the route, query, and fragment', async ({ page }) => {
  await page.route(countryEndpoint, route => route.fulfill({ json: { country: 'TW' } }))
  await page.goto('changelog/?campaign=test#v1.0.15-r1')
  await expect(page).toHaveURL(/\/zh-hant\/changelog\/\?campaign=test#v1\.0\.15-r1$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant')
  await expect(page.getByRole('heading', { name: '更新日誌', exact: true })).toBeVisible()

  await page.locator('.language-switch summary').click()
  await page.getByRole('link', { name: 'English', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page).toHaveURL(/\/changelog\/\?campaign=test&lang=en#v1\.0\.15-r1$/)
  await page.goto('download/')
  await expect(page.getByRole('heading', { name: 'Download Wardrobe' })).toBeVisible()
  await expect(page).toHaveURL(/\/wardrobe-website\/download\/$/)
})

test('keeps English when the lookup fails and honors a manual Chinese choice', async ({ page }) => {
  let lookups = 0
  await page.route(countryEndpoint, async route => {
    lookups += 1
    await route.abort()
  })
  await page.goto('privacy/')
  await expect(page.getByRole('heading', { name: 'Website language selection' })).toBeAttached()
  await page.locator('.language-switch summary').click()
  await page.getByRole('link', { name: '简体中文', exact: true }).click()
  await expect(page.getByRole('heading', { name: '网站语言选择' })).toBeAttached()
  await page.goto('download/history/')
  await expect(page).toHaveURL(/\/zh\/download\/history\/$/)
  await expect(page.getByRole('heading', { name: '历史版本', exact: true })).toBeVisible()
  expect(lookups).toBe(1)
})

test('retries after a failed lookup and uses the current country on the next visit', async ({ page }) => {
  let country: string | undefined
  await page.route(countryEndpoint, route => country
    ? route.fulfill({ json: { country } })
    : route.abort())

  const failed = page.waitForEvent('requestfailed', { predicate: request => request.url() === countryEndpoint })
  await page.goto('download/')
  await failed
  await expect(page.getByRole('heading', { name: 'Download Wardrobe' })).toBeVisible()

  country = 'US'
  const response = page.waitForResponse(countryEndpoint)
  await page.reload()
  await response
  await expect(page.getByRole('heading', { name: 'Download Wardrobe' })).toBeVisible()

  country = 'TW'
  await page.reload()
  await expect(page).toHaveURL(/\/zh-hant\/download\/$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant')
})

test('restores IP selection from a manually selected language and preserves the page', async ({ page }) => {
  let lookups = 0
  await page.route(countryEndpoint, route => {
    lookups += 1
    return route.fulfill({ json: { country: 'TW' } })
  })

  await page.goto('fr/changelog/?campaign=test&lang=fr#v1.0.15-r1')
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  expect(lookups).toBe(0)
  await page.locator('.language-switch summary').click()
  await page.getByRole('link', { name: 'Automatique (région IP)', exact: true }).click()
  await expect(page).toHaveURL(/\/zh-hant\/changelog\/\?campaign=test#v1\.0\.15-r1$/)

  await page.goto('download/')
  await expect(page).toHaveURL(/\/zh-hant\/download\/$/)
  expect(lookups).toBe(2)
})

for (const [country, language, title] of [
  ['CN', 'zh', '下载小衣柜'],
  ['FR', 'fr', 'Télécharger Wardrobe'],
  ['BR', 'pt', 'Baixar Wardrobe'],
  ['MX', 'es', 'Descargar Wardrobe'],
  ['DE', 'de', 'Wardrobe herunterladen'],
  ['JP', 'ja', 'Wardrobe をダウンロード'],
]) {
  test(`selects ${language} for ${country}`, async ({ page }) => {
    await page.route(countryEndpoint, route => route.fulfill({ json: { country } }))
    await page.goto('download/')
    await expect(page).toHaveURL(new RegExp(`/${language}/download/$`))
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
  })
}

test('language links work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4322/wardrobe-website/download/')
  await page.locator('.language-switch summary').click()
  await page.getByRole('link', { name: 'Français', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  await context.close()
})

test('every phone screenshot follows the selected website language', async ({ page }) => {
  await page.goto('?lang=en')
  const preview = page.locator('.phone picture img')
  await expect(preview).toHaveCount(14)
  const sources = () => preview.evaluateAll(images => images.map(img => img.getAttribute('src')))
  const localizedSources = (await sources()).map(src => new Set([src]))

  for (const [label, locale] of [
    ['简体中文', 'zh-CN'], ['繁體中文', 'zh-Hant'], ['Français', 'fr'], ['Português', 'pt'],
    ['Español', 'es'], ['Deutsch', 'de'], ['日本語', 'ja'],
  ]) {
    await page.locator('.language-switch summary').click()
    await page.getByRole('link', { name: label, exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    await expect(preview).toHaveCount(14)
    const current = await sources()
    current.forEach((src, index) => {
      expect(src, `${locale} screenshot ${index + 1}`).toBeTruthy()
      expect(localizedSources[index].has(src), `${locale} screenshot ${index + 1}`).toBe(false)
      localizedSources[index].add(src)
    })
  }
})
