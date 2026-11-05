export function cleanNotes(markdown, dropped = ['下载']) {
  let skipping=false
  return markdown.replace(/\r\n/g,'\n').split('\n').filter(line=>{
    if(line.startsWith('## ')) skipping=dropped.includes(line.slice(3).trim())
    return !skipping
  }).join('\n').replace(/\n{3,}/g,'\n\n').trim()
}
export function validateVersion(version) {
  if(!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('版本应形如 1.0.14')
  return version
}
