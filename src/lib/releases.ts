import { getCollection, type CollectionEntry } from 'astro:content'
import { compareVersions } from '../../scripts/release-utils.mjs'

export const REPO = 'nix18/wardrobe-website'
export const REPO_URL = `https://github.com/${REPO}`

export type Release = CollectionEntry<'releases'>

/** 按版本号从新到旧 */
export async function releases(): Promise<Release[]> {
  const all = await getCollection('releases')
  return all.sort((a, b) => compareVersions(b.data.version, a.data.version))
}

export async function latest(): Promise<Release> {
  const [first] = await releases()
  if (!first) throw new Error('src/content/releases 下还没有任何版本')
  return first
}

export const apkName = (version: string) => `wardrobe-${version}.apk`
export const downloadUrl = (version: string) => `${REPO_URL}/releases/download/v${version}/${apkName(version)}`
export const releaseUrl = (version: string) => `${REPO_URL}/releases/tag/v${version}`

export const formatSize = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`
export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Shanghai' }).format(date)
export const isoDate = (date: Date) => date.toISOString().slice(0, 10)
