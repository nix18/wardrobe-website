import { expect, test } from '@playwright/test'

const countryEndpoint = 'https://ipapi.co/country/'

test('locates visitors by country and preserves the route, query, and fragment', async ({ page }) => {
  await page.route(countryEndpoint, route => route.fulfill({ body: 'TW\n' }))
  await page.goto('changelog/?campaign=test#v1.0.15-r1')
  await expect(page).toHaveURL(/\/zh\/changelog\/\?campaign=test#v1\.0\.15-r1$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  await expect(page.getByRole('heading', { name: '更新日志', exact: true })).toBeVisible()

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
  await page.getByRole('link', { name: '中文', exact: true }).click()
  await expect(page.getByRole('heading', { name: '网站语言选择' })).toBeAttached()
  await page.goto('download/history/')
  await expect(page).toHaveURL(/\/zh\/download\/history\/$/)
  await expect(page.getByRole('heading', { name: '历史版本', exact: true })).toBeVisible()
  expect(lookups).toBe(1)
})

test('keeps English for a country outside the Chinese-language regions', async ({ page }) => {
  await page.route(countryEndpoint, route => route.fulfill({ body: 'US' }))
  await page.goto('download/')
  await expect(page.getByRole('heading', { name: 'Download Wardrobe' })).toBeVisible()
  await expect(page).toHaveURL(/\/wardrobe-website\/download\/$/)
})
