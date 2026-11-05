import { expect, test, type Page } from '@playwright/test'

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    document.documentElement.style.scrollBehavior = 'auto'
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  })
}

async function fitsViewport(page: Page) {
  const result = await page.evaluate(() => {
    const client = document.documentElement.clientWidth
    return {
      client,
      scroll: document.documentElement.scrollWidth,
      overflowing: [...document.querySelectorAll('main *')].filter(element => {
        const box = element.getBoundingClientRect()
        return box.right > client + 1 && !element.closest('.gallery-track')
      }).slice(0, 8).map(element => ({ tag: element.tagName, class: element.className })),
    }
  })
  expect(result.scroll, JSON.stringify(result)).toBeLessThanOrEqual(result.client + 1)
}

test.describe('mobile pages', () => {
  test.use({ isMobile: true, hasTouch: true, deviceScaleFactor: 1 })
  for (const width of [320, 360, 390, 414, 430]) {
    for (const path of ['', 'download/', 'download/history/', 'changelog/', 'privacy/']) {
      test(`${width}px ${path || 'home'} fits the viewport`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 })
        await page.goto(path || './')
        await settle(page)
        await fitsViewport(page)
      })
    }
  }

  for (const width of [320, 390]) {
    for (const reducedMotion of ['reduce', 'no-preference'] as const) {
      test(`home scroll ${width}px ${reducedMotion}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 })
        await page.emulateMedia({ reducedMotion })
        await page.goto('./')
        await settle(page)
        const offsets = await page.evaluate(() => {
          const screens = document.querySelector('#screens') as HTMLElement
          return [0, screens.offsetTop, screens.offsetTop + innerHeight,
            screens.offsetTop + screens.offsetHeight - innerHeight, document.documentElement.scrollHeight]
        })
        for (const top of offsets) {
          await page.evaluate(top => scrollTo(0, top), top)
          await settle(page)
          await fitsViewport(page)
        }
      })
    }
  }
})

test.describe('desktop pages', () => {
  test.use({ viewport: { width: 1440, height: 1000 } })
  for (const path of ['', 'download/']) test(path || 'home', async ({ page }) => {
    await page.goto(path || './')
    await settle(page)
    await fitsViewport(page)
  })
})
