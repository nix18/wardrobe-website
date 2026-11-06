export function cleanNotes(markdown, dropped = ['下载']) {
  let skipping=false
  return markdown.replace(/\r\n/g,'\n').split('\n').filter(line=>{
    if(line.startsWith('## ')) skipping=dropped.includes(line.slice(3).trim())
    return !skipping
  }).join('\n').replace(/\n{3,}/g,'\n\n').trim()
}
export function validateVersion(version) {
  if(!/^\d+\.\d+\.\d+(?:-r[1-9]\d*)?$/.test(version)) throw new Error('版本应形如 1.0.15 或 1.0.15-r1')
  return version
}

/** 已上传的同一文件可直接复用；真正换包才需要显式确认。 */
export function shouldUploadAsset(asset, sha, size, replace = false) {
  if (!asset) return true
  if (asset.digest === `sha256:${sha}` && asset.size === size) return false
  if (!replace) throw new Error('同版本已存在不同 APK；确认后使用 --replace')
  return true
}

/** Numeric revision order; an original release is revision zero. */
export function compareVersions(a,b) {
 const numbers=v=>validateVersion(v).split(/[.-]r?/).map(Number)
 const x=numbers(a),y=numbers(b)
 for(let i=0;i<4;i++)if((x[i]??0)!==(y[i]??0))return (x[i]??0)-(y[i]??0)
 return 0
}
