import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

/** 版本更新说明：由 scripts/publish-release.mjs 在发布时写入，安装包在 GitHub Releases */
const releases = defineCollection({
  loader: glob({ base: './src/content/releases', pattern: '*.md' }),
  schema: z.object({
    version: z.string(),
    date: z.coerce.date(),
    /** 安装包大小（字节） */
    size: z.number(),
    sha256: z.string(),
    /** 一句话摘要，用在首页与下载页 */
    summary: z.string(),
  }),
})

export const collections = { releases }
