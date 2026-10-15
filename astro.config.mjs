// @ts-check
import { defineConfig } from 'astro/config'

// 部署在 GitHub Pages 的项目页：https://nix18.github.io/wardrobe-website/
export default defineConfig({
  site: 'https://nix18.github.io',
  base: '/wardrobe-website',
  trailingSlash: 'always',
})
