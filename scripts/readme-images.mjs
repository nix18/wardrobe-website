// 生成 README 配图：node scripts/readme-images.mjs <输出目录> [网站桌面截图 网站手机截图]
//   icon.png    应用图标
//   banner.png  五个主要界面
//   tryon.png   试穿流程：衣物 + 模特 → 正面、侧面、背面
//   more.png    更多界面（带标题）
//   site.png    网站预览（传入两张网站截图时生成）
// 界面截图与示例照片取自 src/assets；文字用系统字体渲染，需要中文字体。
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const [out, desktopShot, mobileShot] = process.argv.slice(2)
if (!out) throw new Error('用法：node scripts/readme-images.mjs <输出目录> [网站桌面截图 网站手机截图]')
mkdirSync(out, { recursive: true })

const PAPER = '#F5F0EA'
const INK = '#221E1A'
const MUTED = '#847A70'
const CLAY = '#B85A35'
const FONT = "'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif"

/** 界面截图 → [文件名, 状态栏底色, 深色状态栏]，底色与截图顶部衔接（同 src/lib/screens.ts） */
const SCREENS = {
  wardrobe: ['wardrobe-light', '#F7F4F2'],
  detail: ['garment-detail', '#F7F4F2'],
  search: ['search', '#FFFFFF'],
  tryOn: ['try-on', '#FFFFFF'],
  me: ['me', '#F7F4F2'],
  drawer: ['drawer', 'drawer'],
  addSheet: ['add-sheet', '#A7A5A4'],
  form: ['form', '#F7F4F2'],
  dark: ['wardrobe-dark', '#120E0C', true],
  dynamic: ['wardrobe-dynamic', '#EEEDF4'],
}

const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`)
const roundMask = (w, h, r) => svg(w, h, `<rect width="${w}" height="${h}" rx="${r}" fill="#fff"/>`)
const rounded = async (input, w, h, r) =>
  sharp(input).resize(w, h, { fit: 'cover' }).composite([{ input: roundMask(w, h, r), blend: 'dest-in' }]).png().toBuffer()

/** 圆角暖纸色画布，右上角一点陶土色光晕 */
function canvas(w, h) {
  return sharp(
    svg(
      w,
      h,
      `<defs><radialGradient id="g" cx="0.82" cy="0.1" r="0.75"><stop offset="0" stop-color="${CLAY}" stop-opacity="0.13"/><stop offset="1" stop-color="${CLAY}" stop-opacity="0"/></radialGradient></defs>
      <rect width="${w}" height="${h}" rx="32" fill="${PAPER}"/><rect width="${w}" height="${h}" rx="32" fill="url(#g)"/>`,
    ),
  )
}

/** 一组圆角矩形的柔和投影（整张画布大小） */
function shadows(w, h, boxes, { blur = 22, dy = 22, opacity = 0.26 } = {}) {
  return svg(
    w,
    h,
    `<defs><filter id="s" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${blur}"/></filter></defs>` +
      boxes.map(([x, y, bw, bh, r]) => `<rect x="${x}" y="${y + dy}" width="${bw}" height="${bh}" rx="${r}" fill="#4A3020" opacity="${opacity}" filter="url(#s)"/>`).join(''),
  )
}

/** 手机外框里的界面截图（状态栏 + 截图），返回 PNG 与尺寸 */
async function phone(key, W) {
  const [file, bar, dark] = SCREENS[key]
  const pad = Math.round(W * 0.034)
  const sw = W - 2 * pad
  const shot = await sharp(join(root, 'src/assets/screens', `${file}.png`)).resize({ width: sw }).png().toBuffer({ resolveWithObject: true })
  const barH = Math.round(W * 0.118)
  const sh = barH + shot.info.height
  const H = sh + 2 * pad
  const color = dark ? '#F5EFE9' : '#1D1A18'
  const fill = bar === 'drawer' ? 'url(#d)' : bar
  const s = (W * 0.2) / 66
  const status = svg(
    sw,
    barH,
    `<defs><linearGradient id="d"><stop offset="0.769" stop-color="#FFFFFF"/><stop offset="0.769" stop-color="#A7A5A4"/></linearGradient></defs>
    <rect width="${sw}" height="${barH}" fill="${fill}"/>
    <text x="${W * 0.085}" y="${barH / 2 + W * 0.018}" font-family="'Segoe UI', Arial, sans-serif" font-weight="600" font-size="${W * 0.05}" fill="${color}">9:41</text>
    <rect x="${sw * 0.35}" y="${barH * 0.24}" width="${sw * 0.3}" height="${barH * 0.52}" rx="${barH * 0.26}" fill="#0C0B0A"/>
    <g transform="translate(${sw - W * 0.085 - W * 0.2} ${barH / 2 - 7 * s}) scale(${s})" fill="${color}">
      <rect x="0" y="9" width="3" height="4" rx="1"/><rect x="5" y="6.5" width="3" height="6.5" rx="1"/><rect x="10" y="4" width="3" height="9" rx="1"/><rect x="15" y="1.5" width="3" height="11.5" rx="1"/>
      <path d="M30 4.2a10.5 10.5 0 0 1 13.6 0l-1.5 1.6a8.3 8.3 0 0 0-10.6 0L30 4.2Zm2.9 3.1a6.3 6.3 0 0 1 7.8 0l-1.5 1.6a4.1 4.1 0 0 0-4.8 0l-1.5-1.6Zm2.9 3.1a2 2 0 0 1 2 0L36.8 12l-1-1.6Z"/>
      <rect x="47.5" y="1.5" width="15" height="10" rx="3" fill="none" stroke="${color}" stroke-opacity="0.4"/><rect x="49.5" y="3.5" width="9.5" height="6" rx="1.5"/>
    </g>`,
  )
  const screen = await sharp({ create: { width: sw, height: sh, channels: 4, background: '#000000' } })
    .composite([{ input: status, top: 0, left: 0 }, { input: shot.data, top: barH, left: 0 }, { input: roundMask(sw, sh, W * 0.13), blend: 'dest-in' }])
    .png()
    .toBuffer()
  const frame = svg(W, H, `<rect width="${W}" height="${H}" rx="${W * 0.16}" fill="#1D1A18"/><rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="${W * 0.16}" fill="none" stroke="#fff" stroke-opacity="0.1" stroke-width="1.5"/>`)
  const png = await sharp(frame).composite([{ input: screen, left: pad, top: pad }]).png().toBuffer()
  return { png, w: W, h: H, r: W * 0.16 }
}

/** 一排手机：[keys] 依次排开，[lift] 为每台的上移量，[captions] 为下方的标题与说明 */
async function phoneRow(file, keys, { W, gap, lift = [], captions, margin = 80, top = 60 }) {
  const phones = await Promise.all(keys.map((k) => phone(k, W)))
  const ph = phones[0].h
  const maxLift = Math.max(0, ...lift)
  const capH = captions ? 86 : 0
  const width = margin * 2 + keys.length * W + (keys.length - 1) * gap
  const height = top + maxLift + ph + capH + (captions ? 44 : 64)
  const pos = phones.map((p, i) => [margin + i * (W + gap), top + maxLift - (lift[i] ?? 0)])
  const layers = [
    { input: shadows(width, height, pos.map(([x, y]) => [x + 10, y + 10, W - 20, ph - 20, phones[0].r])) },
    ...phones.map((p, i) => ({ input: p.png, left: pos[i][0], top: pos[i][1] })),
  ]
  if (captions) {
    const y = top + maxLift + ph + 44
    layers.push({
      input: svg(
        width,
        height,
        captions
          .map(([title, sub], i) => {
            const cx = pos[i][0] + W / 2
            return `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${FONT}" font-size="24" font-weight="700" fill="${INK}">${title}</text>
              <text x="${cx}" y="${y + 34}" text-anchor="middle" font-family="${FONT}" font-size="18" fill="${MUTED}">${sub}</text>`
          })
          .join(''),
      ),
    })
  }
  await canvas(width, height).composite(layers).png({ compressionLevel: 9, palette: false }).toFile(join(out, file))
  console.log(file, width, height)
}

/** 「AI生成」标识（与应用里的玻璃胶囊同一版式） */
const aiMark = (x, y, size = 15) => {
  const w = size * 4.6
  const h = size * 1.9
  return `<rect x="${x - w}" y="${y - h}" width="${w}" height="${h}" rx="${h / 2}" fill="#fff" fill-opacity="0.72" stroke="#fff" stroke-opacity="0.9"/>
    <text x="${x - w / 2}" y="${y - h / 2 + size * 0.36}" text-anchor="middle" font-family="${FONT}" font-size="${size}" font-weight="700" fill="${INK}">AI生成</text>`
}

/** 试穿流程：三件衣物 + 模特 → 正面、侧面、背面 */
async function tryon() {
  const photo = (n) => join(root, 'src/assets/photos', `${n}.jpg`)
  const M = 72
  const top = 64
  const gw = 118
  const gh = 118
  const gGap = 20
  const mw = 270
  const mh = 360
  const vw = 296
  const vh = 395
  const vGap = 22
  const colH = vh
  const gx = M
  const gTop = top + (colH - (3 * gh + 2 * gGap)) / 2
  const plusX = gx + gw + 46
  const mx = plusX + 46
  const mTop = top + (colH - mh) / 2
  const ax = mx + mw + 70
  const vx = ax + 70
  const width = vx + 3 * vw + 2 * vGap + M
  const height = top + colH + 104

  const garments = await Promise.all(['coat', 'dress', 'bag'].map((n) => rounded(photo(n), gw, gh, 16)))
  const model = await rounded(photo('look1'), mw, mh, 22)
  const views = await Promise.all(['look2', 'look2_side', 'look2_back'].map((n) => rounded(photo(n), vw, vh, 22)))
  const boxes = [
    ...[0, 1, 2].map((i) => [gx, gTop + i * (gh + gGap), gw, gh, 16]),
    [mx, mTop, mw, mh, 22],
    ...[0, 1, 2].map((i) => [vx + i * (vw + vGap), top, vw, vh, 22]),
  ]
  const ly = top + colH + 56
  const label = (x, text) => `<text x="${x}" y="${ly}" text-anchor="middle" font-family="${FONT}" font-size="22" fill="${MUTED}">${text}</text>`
  const ay = top + colH / 2
  const overlay = svg(
    width,
    height,
    `<text x="${plusX}" y="${ay + 14}" text-anchor="middle" font-family="${FONT}" font-size="44" font-weight="300" fill="${MUTED}">+</text>
    <circle cx="${ax}" cy="${ay}" r="34" fill="${CLAY}"/>
    <path d="M${ax - 13} ${ay}h26M${ax + 3} ${ay - 11}l11 11-11 11" fill="none" stroke="#FFFAF6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    ${aiMark(mx + mw - 12, mTop + mh - 12, 14)}
    ${[0, 1, 2].map((i) => aiMark(vx + i * (vw + vGap) + vw - 12, top + vh - 12, 14)).join('')}
    ${label(gx + gw / 2, '衣物')}${label(mx + mw / 2, '模特')}
    ${['正面', '侧面', '背面'].map((t, i) => label(vx + i * (vw + vGap) + vw / 2, t)).join('')}`,
  )
  await canvas(width, height)
    .composite([
      { input: shadows(width, height, boxes, { blur: 16, dy: 14, opacity: 0.2 }) },
      ...garments.map((input, i) => ({ input, left: gx, top: Math.round(gTop + i * (gh + gGap)) })),
      { input: model, left: mx, top: Math.round(mTop) },
      ...views.map((input, i) => ({ input, left: vx + i * (vw + vGap), top })),
      { input: overlay },
    ])
    .png({ compressionLevel: 9 })
    .toFile(join(out, 'tryon.png'))
  console.log('tryon.png', width, height)
}

/** 网站预览：浏览器窗口里的首页，右下角叠一台手机里的下载页 */
async function site() {
  const bw = 1240
  // 裁掉右侧的浏览器滚动条（15 个 CSS 像素）
  const meta = await sharp(desktopShot).metadata()
  const scrollbar = Math.round((meta.width * 15) / 1440)
  const desk = await sharp(desktopShot)
    .extract({ left: 0, top: 0, width: meta.width - scrollbar, height: meta.height })
    .resize({ width: bw })
    .png()
    .toBuffer({ resolveWithObject: true })
  const barH = 46
  const bh = barH + desk.info.height
  const browser = await sharp(
    svg(
      bw,
      bh,
      `<rect width="${bw}" height="${bh}" fill="#FFFFFF"/><rect width="${bw}" height="${barH}" fill="#ECE6DF"/>
      ${[0, 1, 2].map((i) => `<circle cx="${26 + i * 22}" cy="${barH / 2}" r="6.5" fill="${['#E0675C', '#E3B04B', '#71B95B'][i]}"/>`).join('')}
      <rect x="${bw / 2 - 230}" y="10" width="460" height="26" rx="13" fill="#F8F5F1"/>
      <text x="${bw / 2}" y="28" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="14" fill="${MUTED}">nix18.github.io/wardrobe-website</text>`,
    ),
  )
    .composite([{ input: desk.data, top: barH, left: 0 }, { input: roundMask(bw, bh, 18), blend: 'dest-in' }])
    .png()
    .toBuffer()

  const W = 300
  const pad = Math.round(W * 0.034)
  const sw = W - 2 * pad
  const mob = await sharp(mobileShot).resize({ width: sw }).png().toBuffer({ resolveWithObject: true })
  const sh = mob.info.height
  const H = sh + 2 * pad
  const screen = await sharp(mob.data).composite([{ input: roundMask(sw, sh, W * 0.13), blend: 'dest-in' }]).png().toBuffer()
  const handset = await sharp(svg(W, H, `<rect width="${W}" height="${H}" rx="${W * 0.16}" fill="#1D1A18"/>`))
    .composite([{ input: screen, left: pad, top: pad }])
    .png()
    .toBuffer()

  const M = 64
  const bx = M
  const by = M
  const px = bx + bw - W + 140
  const py = by + bh - H + 90
  const width = px + W + M
  const height = py + H + M
  await canvas(width, height)
    .composite([
      { input: shadows(width, height, [[bx + 12, by + 12, bw - 24, bh - 24, 18], [px + 10, py + 10, W - 20, H - 20, W * 0.16]]) },
      { input: browser, left: bx, top: by },
      { input: handset, left: px, top: py },
    ])
    .png({ compressionLevel: 9 })
    .toFile(join(out, 'site.png'))
  console.log('site.png', width, height)
}

await sharp(readFileSync(join(root, 'public/favicon.svg')), { density: 600 }).resize(160, 160).png().toFile(join(out, 'icon.png'))
await phoneRow('banner.png', ['wardrobe', 'detail', 'tryOn', 'search', 'me'], { W: 290, gap: 40, lift: [0, 34, 60, 34, 0] })
await tryon()
await phoneRow('more.png', ['drawer', 'addSheet', 'dark', 'dynamic'], {
  W: 290,
  gap: 64,
  captions: [
    ['侧边栏', '分类、模特、AI 服务、同步'],
    ['添加衣物', '拍照、相册多选、批量导入'],
    ['深色模式', '夜里看也不刺眼'],
    ['壁纸取色', '跟随系统配色'],
  ],
})
if (desktopShot && mobileShot) await site()
