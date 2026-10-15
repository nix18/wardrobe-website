// 用图像模型生成网站与应用截图的示例图片（衣物平铺图、模特形象、试穿效果）。
// 用法：IMAGE_API_BASE=… IMAGE_API_KEY=… IMAGE_MODEL=gpt-image-2.5 node scripts/gen-images.mjs [名称…] [--force]
// 原图保存在 art/photos/raw/（不提交），裁剪、压缩后的 JPEG 保存在 src/assets/photos/（网站使用，也是应用截图测试的示例图）。
// 有参考图（refs）的任务走 /v1/images/edits，其余走 /v1/images/generations；已有结果默认跳过。
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { jobs } from '../art/photo-prompts.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const rawDir = join(root, 'art/photos/raw')
const outDir = join(root, 'src/assets/photos')
mkdirSync(rawDir, { recursive: true })

const base = process.env.IMAGE_API_BASE?.replace(/\/+$/, '')
const key = process.env.IMAGE_API_KEY
const model = process.env.IMAGE_MODEL || 'gpt-image-2.5'
if (!base || !key) throw new Error('需要环境变量 IMAGE_API_BASE 与 IMAGE_API_KEY')

const args = process.argv.slice(2)
const force = args.includes('--force')
const only = args.filter((a) => !a.startsWith('--'))

async function call(job) {
  const started = Date.now()
  let res
  if (job.refs?.length) {
    const form = new FormData()
    form.append('model', model)
    form.append('prompt', job.prompt)
    form.append('size', job.size)
    form.append('n', '1')
    for (const ref of job.refs) {
      const file = join(rawDir, `${ref}.png`)
      form.append('image[]', new Blob([readFileSync(file)], { type: 'image/png' }), `${ref}.png`)
    }
    res = await fetch(`${base}/v1/images/edits`, { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form, signal: AbortSignal.timeout(600_000) })
  } else {
    res = await fetch(`${base}/v1/images/generations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: job.prompt, size: job.size, n: 1 }),
      signal: AbortSignal.timeout(600_000),
    })
  }
  const text = await res.text()
  const seconds = ((Date.now() - started) / 1000).toFixed(0)
  if (!res.ok) throw new Error(`HTTP ${res.status} after ${seconds}s: ${text.slice(0, 300)}`)
  const b64 = JSON.parse(text).data?.[0]?.b64_json
  if (!b64) throw new Error(`no image after ${seconds}s: ${text.slice(0, 300)}`)
  return { png: Buffer.from(b64, 'base64'), seconds }
}

/** 按任务的比例从中心裁剪（[focusY] 为纵向裁剪位置，0 顶部、0.5 居中、1 底部），缩放到 [width] 宽 */
async function finish(job, png) {
  const img = sharp(png)
  const { width, height } = await img.metadata()
  const [aw, ah] = job.aspect
  let w = width
  let h = Math.round((width * ah) / aw)
  if (h > height) { h = height; w = Math.round((height * aw) / ah) }
  const left = Math.round((width - w) / 2)
  const top = Math.round((height - h) * (job.focusY ?? 0.5))
  return sharp(png).extract({ left, top, width: w, height: h }).resize({ width: job.width }).jpeg({ quality: 88, mozjpeg: true }).toBuffer()
}

for (const job of jobs) {
  if (only.length && !only.includes(job.name)) continue
  const raw = join(rawDir, `${job.name}.png`)
  if (!existsSync(raw) || force) {
    for (let attempt = 1; ; attempt++) {
      try {
        const { png, seconds } = await call(job)
        writeFileSync(raw, png)
        console.log(`${job.name}: generated in ${seconds}s`)
        break
      } catch (e) {
        console.log(`${job.name}: attempt ${attempt} failed: ${e.message}`)
        if (attempt >= 3) throw e
      }
    }
  }
  const jpg = await finish(job, readFileSync(raw))
  writeFileSync(join(outDir, `${job.name}.jpg`), jpg)
  console.log(`${job.name}: ${(jpg.length / 1024).toFixed(0)} KB`)
}
