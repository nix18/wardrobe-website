// 从已验证的应用 Release 发布公开 APK，再写入站点元数据。提交并 push 后由 Pages workflow 自动部署。
// npm run release -- 1.0.14 --source-repo nix18/clothes-app-workspace --summary "更新摘要"
// 本地文件仍可用 --apk <file> --notes <file>；同版本替换须显式 --replace。
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cleanNotes, validateVersion, shouldUploadAsset } from './release-utils.mjs'
const REPO='nix18/wardrobe-website'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const args=process.argv.slice(2)
const option=(name)=>{const i=args.indexOf(`--${name}`);return i<0?undefined:args[i+1]}
const version=validateVersion(args[0]?.replace(/^v/,'')??'')
const summary=option('summary');if(!summary) throw new Error('需要 --summary 更新摘要')
const date=option('date')??new Date().toISOString()
if(Number.isNaN(Date.parse(date))) throw new Error('无效的发布日期')
const gh=(params)=>execFileSync('gh',params,{encoding:'utf8'})
const release=(repo)=>JSON.parse(gh(['release','view',`v${version}`,'--repo',repo,'--json','tagName,body,assets']))
const expected=`wardrobe-${version}.apk`
const work=mkdtempSync(join(root,'.release-work-'))
try {
  let apk=option('apk'), notes=option('notes')?readFileSync(option('notes'),'utf8'):undefined, expectedSha
  const source=option('source-repo')
  if(source) {
    const published=release(source)
    const asset=published.assets.find(a=>a.name===expected)
    if(!asset?.digest?.startsWith('sha256:')) throw new Error('来源 Release 缺少 APK SHA-256，停止发布')
    expectedSha=asset.digest.slice(7)
    gh(['release','download',`v${version}`,'--repo',source,'--pattern',expected,'--dir',work])
    apk=join(work,expected); notes??=published.body
  }
  if(!apk||!notes||basename(apk)!==expected) throw new Error(`需要来源 Release 或 --apk ${expected} --notes <file>`)
  const bytes=readFileSync(apk),size=statSync(apk).size
  if(bytes[0]!==0x50||bytes[1]!==0x4b||size<1024) throw new Error('APK 不是有效的 ZIP 安装包')
  const sha=createHash('sha256').update(bytes).digest('hex')
  if(expectedSha&&sha!==expectedSha) throw new Error('下载 APK 的 SHA-256 与来源 Release 不一致')
  notes=cleanNotes(notes,['下载',...args.flatMap((x,i)=>x==='--drop'?[args[i+1]]:[])])
  const notesFile=join(work,'notes.md')
  writeFileSync(notesFile,`${notes}\n\n---\n\nSHA-256（${expected}）：\`${sha}\`\n`)
  const upload=!args.includes('--no-upload')
  if(upload) {
    let current
    // API 失败不能误判为“版本不存在”；先列出 releases 再确定是否创建。
    const releases=JSON.parse(gh(['api',`repos/${REPO}/releases?per_page=100`]))
    current=releases.find(r=>r.tag_name===`v${version}`)
    if(!current) gh(['release','create',`v${version}`,apk,'--repo',REPO,'--title',`小衣柜 v${version}`,'--notes-file',notesFile,'--draft'])
    else {
      const old=release(REPO).assets.find(a=>a.name===expected)
      if(shouldUploadAsset(old,sha,size,args.includes('--replace')))
        gh(['release','upload',`v${version}`,apk,'--repo',REPO,'--clobber'])
    }
    const uploaded=release(REPO).assets.find(a=>a.name===expected)
    if(uploaded?.digest!==`sha256:${sha}`||uploaded.size!==size) throw new Error('公开资源校验失败，站点元数据未更新')
    gh(['release','edit',`v${version}`,'--repo',REPO,'--draft=false','--latest','--notes-file',notesFile])
  }
  const metadata=['---',`version: '${version}'`,`date: ${date}`,`size: ${size}`,`sha256: '${sha}'`,`summary: ${JSON.stringify(summary)}`,'---','',notes,''].join('\n')
  writeFileSync(join(root,'src/content/releases',`v${version}.md`),metadata)
  console.log(`v${version} APK 校验完成：${sha}\n提交并推送站点改动后将自动部署。`)
} finally {
  if(dirname(resolve(work))!==root||!basename(work).startsWith('.release-work-')) throw new Error('临时目录越界')
  rmSync(work,{recursive:true,force:true})
}
