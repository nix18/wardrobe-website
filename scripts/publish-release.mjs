// 发布一个版本：上传安装包到本仓库的 GitHub Releases，并写入网站的更新说明（src/content/releases/v<版本>.md）。
//
//   node scripts/publish-release.mjs 1.0.6 --apk path/to/wardrobe-1.0.6.apk --notes path/to/v1.0.6.md --summary "一句话摘要"
//     [--date 2026-10-15T03:00:42Z]  发布时间，默认为现在
//     [--no-upload]                  只写更新说明，不上传（安装包已在 Releases 中）
//     [--drop 标题]                  另外去掉更新说明中的某个二级小节（可重复）
//
// 之后提交并推送 src/content/releases/，GitHub Actions 会重新构建网站，“下载最新版”随之更新。
// 更新说明中的“## 下载”一节会被去掉：网站与 Releases 页面本身就是下载入口（其中的 R8 映射文件也不公开发布）。
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync, writeFileSync, mkdtempSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const REPO = 'nix18/wardrobe-website'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const args = process.argv.slice(2)
const version = args[0]?.replace(/^v/, '')
const option = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const apk = option('apk')
const notesFile = option('notes')
const summary = option('summary')
const date = option('date') ?? new Date().toISOString()
const upload = !args.includes('--no-upload')
if (!version || !/^\d+\.\d+\.\d+$/.test(version) || !apk || !notesFile || !summary) {
  console.error('用法：node scripts/publish-release.mjs <版本> --apk <安装包> --notes <更新说明.md> --summary <一句话摘要> [--date <时间>] [--no-upload]')
  process.exit(1)
}
const expected = `wardrobe-${version}.apk`
if (basename(apk) !== expected) throw new Error(`安装包文件名应为 ${expected}（网站的下载链接按这个名字拼接）`)

const bytes = readFileSync(apk)
const size = statSync(apk).size
const sha256 = createHash('sha256').update(bytes).digest('hex')
const dropped = ['下载', ...args.flatMap((a, i) => (a === '--drop' ? [args[i + 1]] : []))]

/** 去掉 Markdown 中标题在 [titles] 里的二级小节（到下一个二级标题为止） */
function dropSections(md, titles) {
  let skipping = false
  return md
    .split('\n')
    .filter((line) => {
      if (line.startsWith('## ')) skipping = titles.includes(line.slice(3).trim())
      return !skipping
    })
    .join('\n')
}

const notes = dropSections(readFileSync(notesFile, 'utf8').replace(/\r\n/g, '\n'), dropped)
  .replace(/\n{3,}/g, '\n\n')
  .trim()

const frontmatter = [
  '---',
  `version: '${version}'`,
  `date: ${date}`,
  `size: ${size}`,
  `sha256: '${sha256}'`,
  `summary: ${JSON.stringify(summary)}`,
  '---',
  '',
].join('\n')
const target = join(root, 'src/content/releases', `v${version}.md`)
writeFileSync(target, `${frontmatter}${notes}\n`)
console.log(`写入 ${target}（${(size / 1048576).toFixed(1)} MB，SHA-256 ${sha256}）`)

if (upload) {
  const body = join(mkdtempSync(join(tmpdir(), 'release-')), 'notes.md')
  writeFileSync(body, `${notes}\n\n---\n\nSHA-256（${expected}）：\`${sha256}\`\n`)
  const exists = (() => {
    try {
      execFileSync('gh', ['release', 'view', `v${version}`, '--repo', REPO], { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  })()
  if (exists) {
    execFileSync('gh', ['release', 'upload', `v${version}`, apk, '--repo', REPO, '--clobber'], { stdio: 'inherit' })
    execFileSync('gh', ['release', 'edit', `v${version}`, '--repo', REPO, '--notes-file', body], { stdio: 'inherit' })
  } else {
    execFileSync('gh', ['release', 'create', `v${version}`, apk, '--repo', REPO, '--title', `小衣柜 v${version}`, '--notes-file', body], { stdio: 'inherit' })
  }
  console.log(`已上传到 https://github.com/${REPO}/releases/tag/v${version}`)
}
