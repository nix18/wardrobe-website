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

test('keeps English for a country outside the localized regions', async ({ page }) => {
  await page.route(countryEndpoint, route => route.fulfill({ json: { country: 'US' } }))
  await page.goto('download/')
  await expect(page.getByRole('heading', { name: 'Download Wardrobe' })).toBeVisible()
  await expect(page).toHaveURL(/\/wardrobe-website\/download\/$/)
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
