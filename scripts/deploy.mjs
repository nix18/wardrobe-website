// 日常 push main 自动部署。此命令仅手动重试已提交的 main，不在本地重复构建或强推 gh-pages。
import { execFileSync } from 'node:child_process'
execFileSync('gh', ['workflow', 'run', 'pages.yml', '--repo', 'nix18/wardrobe-website', '--ref', 'main'], { stdio: 'inherit' })
console.log('已触发网站检查、构建和部署：https://github.com/nix18/wardrobe-website/actions/workflows/pages.yml')
