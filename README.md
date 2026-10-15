# 小衣柜网站

小衣柜（Android 衣橱应用）的产品网站：https://nix18.github.io/wardrobe-website/

- 首页：主要功能、界面截图、最近更新、常见问题；
- 下载：最新版本的安装包、安装步骤与 SHA-256 校验；旧版本在「历史版本」页；
- 更新日志：最新的 3 个版本直接展示，其余收在“更多版本”里；
- 隐私政策：与应用内的隐私政策相同。

安装包放在本仓库的 [Releases](https://github.com/nix18/wardrobe-website/releases)，网站的下载链接指向这里。

## 开发

需要 Node.js 22.12 及以上。

```bash
npm ci
npm run dev        # http://localhost:4321/wardrobe-website/
npm run build      # 输出到 dist/
```

发布：`npm run deploy` 在本机构建，并把 `dist/` 推送到 `gh-pages` 分支，GitHub Pages 从这个分支发布
（`gh-pages` 只保留最新一次构建）。源码照常提交到 `main`。

## 发布新版本

在应用仓库构建并签名正式版后，用安装包和更新说明发布：

```bash
npm run release -- 1.0.7 --apk path/to/wardrobe-1.0.7.apk --notes path/to/docs/releases/v1.0.7.md --summary "一句话摘要"
git add src/content/releases && git commit -m "发布 v1.0.7" && git push
npm run deploy
```

脚本会把安装包上传到本仓库的 Releases（标题“小衣柜 v1.0.7”，说明末尾附 SHA-256），并写入 `src/content/releases/v1.0.7.md`
（版本、日期、大小、SHA-256、摘要与更新说明）。更新说明中的“## 下载”一节会被去掉，可以用 `--drop 标题` 再去掉其他小节。
部署后首页、下载页与更新日志自动指向新版本。

## 素材

- `src/assets/screens/`：应用界面截图，由应用仓库的截图测试生成（`./gradlew :app:testDebugUnitTest -Pscreenshots`，输出在
  `app/build/screens/`）。截图顶部的颜色写在 `src/lib/screens.ts`，手机外框的状态栏用它衔接。
- `src/assets/photos/`：衣物、模特与试穿示例图，用图像模型生成，提示词在 `art/photo-prompts.mjs`：

  ```bash
  IMAGE_API_BASE=… IMAGE_API_KEY=… IMAGE_MODEL=gpt-image-2.5 npm run gen-images -- [名称…] [--force]
  ```

  结果写入 `src/assets/photos/`（原图在不提交的 `art/photos/raw/`）；同名图片也是应用截图测试的示例图
  （复制到应用仓库的 `app/src/test/resources/screens/`）。
- `public/og.png`、`public/icon-180.png`：分享预览图与触屏图标，`npm run og-image` 生成（需要中文字体）。

网站中的模特、衣物与试穿图片均为 AI 生成的示例，页脚有说明。
