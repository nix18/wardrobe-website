// 生成社交分享预览图 public/og.png（1200×630）与 Apple 触屏图标 public/icon-180.png：node scripts/og-image.mjs
// 文字用系统字体渲染，需在装有中文字体的电脑上运行；生成结果提交到仓库。
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const photo = (name) => join(root, 'src/assets/photos', `${name}.jpg`)
const icon = readFileSync(join(root, 'public/favicon.svg'))

const W = 1200
const H = 630
const font = "'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif"
const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <text x="176" y="203" font-family="${font}" font-size="38" font-weight="700" fill="#221E1A">小衣柜</text>
  <text x="88" y="318" font-family="${font}" font-size="56" font-weight="700" fill="#221E1A" letter-spacing="-1">你的衣柜，</text>
  <text x="88" y="392" font-family="${font}" font-size="56" font-weight="700" fill="#221E1A" letter-spacing="-1">会整理，也会试穿。</text>
  <text x="88" y="456" font-family="${font}" font-size="24" fill="#4B443D">AI 识别标签 · 一句话找衣服 · 三视图试穿</text>
  <rect x="88" y="512" width="248" height="52" rx="26" fill="#B85A35"/>
  <text x="212" y="546" text-anchor="middle" font-family="${font}" font-size="22" font-weight="700" fill="#FFFAF6">下载 Android 版</text>
</svg>`)

const card = async (name, w, h) => {
  const mask = Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="22" fill="#fff"/></svg>`)
  return sharp(photo(name)).resize(w, h, { fit: 'cover' }).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
}

const cw = 176
const ch = 236
const views = await Promise.all(['look2', 'look2_side', 'look2_back'].map((n) => card(n, cw, ch)))
const shadow = Buffer.from(`<svg width="${W}" height="${H}"><defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter></defs>
  ${[0, 1, 2].map((i) => `<rect x="${640 + i * 184}" y="${214 + (i === 1 ? -40 : 0) + 24}" width="${cw}" height="${ch}" rx="22" fill="#5B3E28" opacity="0.28" filter="url(#b)"/>`).join('')}
</svg>`)
const glow = Buffer.from(`<svg width="${W}" height="${H}"><defs><radialGradient id="g" cx="0.8" cy="0.3" r="0.7"><stop offset="0" stop-color="#B85A35" stop-opacity="0.16"/><stop offset="1" stop-color="#B85A35" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`)

await sharp({ create: { width: W, height: H, channels: 3, background: '#F5F0EA' } })
  .composite([
    { input: glow },
    { input: shadow },
    ...views.map((input, i) => ({ input, left: 640 + i * 184, top: 214 + (i === 1 ? -40 : 0) })),
    { input: await sharp(icon, { density: 400 }).resize(72, 72).png().toBuffer(), left: 88, top: 148 },
    { input: text },
  ])
  .png({ compressionLevel: 9 })
  .toFile(join(root, 'public/og.png'))

await sharp(icon, { density: 600 }).resize(180, 180).flatten({ background: '#B85A35' }).png().toFile(join(root, 'public/icon-180.png'))
console.log('public/og.png, public/icon-180.png')
