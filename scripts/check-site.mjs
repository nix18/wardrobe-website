import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
const root = resolve('dist')
const html = []
function walk(dir) { for (const e of readdirSync(dir, {withFileTypes:true})) {
  const p=join(dir,e.name); if(e.isDirectory()) walk(p); else if(e.name.endsWith('.html')) html.push(p)
} }
walk(root)
const errors=[]
for (const file of html) {
  const text=readFileSync(file,'utf8')
  if (!text.includes('<title>') || !text.includes('lang="zh-CN"')) errors.push(`${file}: missing title/lang`)
  for (const match of text.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)) {
    const url=match[1].split('?')[0]
    if (!url.startsWith('/wardrobe-website/')) continue
    const path=resolve(root,decodeURIComponent(url.slice('/wardrobe-website/'.length)))
    if (!path.startsWith(root) || !existsSync(path) || statSync(path).isDirectory() && !existsSync(join(path,'index.html'))) errors.push(`${file}: broken ${url}`)
  }
}
if(errors.length) throw new Error(errors.join('\n'))
console.log(`Checked ${html.length} pages: title, language and local links/assets OK`)
