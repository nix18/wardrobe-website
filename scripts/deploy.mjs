// 构建网站并发布到 gh-pages 分支（GitHub Pages 从这个分支发布）：npm run deploy
// gh-pages 只保留最新一次构建（单个提交、强制推送），仓库不会因为图片随每次部署累积而变大。
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
// Windows 上 npm 是 npm.cmd，需要经由 shell 调用；git 不经 shell，参数（如含空格的提交说明）原样传入
const run = (cmd, args, cwd = root) => execFileSync(cmd, args, { cwd, stdio: 'inherit', shell: cmd === 'npm' && process.platform === 'win32' })
const read = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8' }).trim()

const remote = read('git', ['remote', 'get-url', 'origin'])
const commit = read('git', ['rev-parse', '--short', 'HEAD'])
const dirty = read('git', ['status', '--porcelain'])
if (dirty) console.warn('注意：工作区有未提交的改动，也会一起发布。')

run('npm', ['run', 'build'])
const dist = join(root, 'dist')
if (!existsSync(join(dist, '.nojekyll'))) throw new Error('dist/.nojekyll 缺失：Pages 会忽略以下划线开头的 _astro 目录')

const work = mkdtempSync(join(tmpdir(), 'pages-'))
try {
  cpSync(dist, work, { recursive: true })
  run('git', ['init', '-q', '-b', 'gh-pages'], work)
  run('git', ['config', 'core.autocrlf', 'false'], work)
  run('git', ['add', '-A'], work)
  run('git', ['commit', '-q', '-m', `部署 ${commit}${dirty ? '（含未提交改动）' : ''}`], work)
  run('git', ['push', '-q', '-f', remote, 'gh-pages'], work)
} finally {
  rmSync(work, { recursive: true, force: true })
}
console.log('已推送到 gh-pages，GitHub Pages 会在一两分钟内更新：https://nix18.github.io/wardrobe-website/')
