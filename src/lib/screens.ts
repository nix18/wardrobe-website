// 应用界面截图（应用仓库的 Robolectric 截图测试生成，见 README）及各自状态栏的底色（取截图顶部的颜色，与应用顶栏衔接）
import type { ImageMetadata } from 'astro'
import wardrobe from '../assets/screens/wardrobe-light.png'
import detail from '../assets/screens/garment-detail.png'
import search from '../assets/screens/search.png'
import tryOn from '../assets/screens/try-on.png'
import me from '../assets/screens/me.png'
import drawer from '../assets/screens/drawer.png'
import addSheet from '../assets/screens/add-sheet.png'
import form from '../assets/screens/form.png'
import wardrobeDark from '../assets/screens/wardrobe-dark.png'
import wardrobeDynamic from '../assets/screens/wardrobe-dynamic.png'
import meDark from '../assets/screens/me-dark.png'

export interface Screen {
  src: ImageMetadata
  /** 状态栏背景（CSS） */
  bar: string
  /** 深色状态栏（白色文字与图标） */
  dark?: boolean
}

const paper = '#F7F4F2'
const scrim = '#A7A5A4'

export const screens = {
  wardrobe: { src: wardrobe, bar: paper },
  detail: { src: detail, bar: paper },
  search: { src: search, bar: '#FFFFFF' },
  tryOn: { src: tryOn, bar: '#FFFFFF' },
  me: { src: me, bar: paper },
  drawer: { src: drawer, bar: `linear-gradient(90deg, #FFFFFF 0 74%, ${scrim} 74%)` },
  addSheet: { src: addSheet, bar: scrim },
  form: { src: form, bar: paper },
  wardrobeDark: { src: wardrobeDark, bar: '#120E0C', dark: true },
  wardrobeDynamic: { src: wardrobeDynamic, bar: '#EEEDF4' },
  meDark: { src: meDark, bar: '#120E0C', dark: true },
} satisfies Record<string, Screen>
