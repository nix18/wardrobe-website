// 截图来自应用仓库的 Robolectric 测试。状态栏底色取自截图顶部。
import type { ImageMetadata } from 'astro'
import type { Language } from './language'

const images = import.meta.glob<ImageMetadata>('../assets/screens/*/*.webp', {
  eager: true,
  import: 'default',
})

export interface Screen {
  src: ImageMetadata
  bar: string
  dark?: boolean
}

const paper = '#F7F4F2'
const scrim = '#A7A5A4'

export function screensFor(language: Language) {
  const screen = (name: string, bar: string, dark = false): Screen => {
    const src = images[`../assets/screens/${language}/${name}.webp`]
    if (!src) throw new Error(`Missing ${language} app screenshot: ${name}`)
    return { src, bar, dark }
  }

  return {
    wardrobe: screen('wardrobe-light', paper),
    detail: screen('garment-detail', paper),
    search: screen('search', '#FFFFFF'),
    tryOn: screen('try-on', '#FFFFFF'),
    me: screen('me', paper),
    drawer: screen('drawer', `linear-gradient(90deg, #FFFFFF 0 76.9%, ${scrim} 76.9%)`),
    addSheet: screen('add-sheet', scrim),
    backgrounds: screen('backgrounds-light', scrim),
    wardrobeDark: screen('wardrobe-dark', '#120E0C', true),
    wardrobeDynamic: screen('wardrobe-dynamic', '#EEEDF4'),
    meDark: screen('me-dark', '#120E0C', true),
  }
}
