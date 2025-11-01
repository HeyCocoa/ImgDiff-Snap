# ImgDiff-Snap
In-browser image diff with slider and heatmap. Change ratio, save PNG. 100% local.

纯前端图片对比：拖入两张同尺寸图片，滑块 + 红色热力图，显示变化占比，可下载热力图 PNG，全程本地运行。

## Requirements / 环境要求
- Node.js >= 18

## Install / 安装依赖
任选一个包管理器执行安装（推荐 npm）：

```bash
# npm（推荐）
npm install

# 或 pnpm
pnpm install

# 或 yarn
yarn
```

## Scripts / 常用命令
- 开发（本地预览）：`npm run dev`
- 构建（产出静态站点）：`npm run build`
- 预览构建产物：`npm run preview`

上述命令等价于 pnpm / yarn 的 `pnpm dev|build|preview`、`yarn dev|build|preview`。

## Optional / 可选优化（Preact）
若追求更小包体，可切换到 Preact（非必须）：

```bash
# 安装预设（dev 依赖）
npm i -D @preact/preset-vite preact
```

在 `vite.config.ts` 中启用预设或添加 alias：

```ts
// 示例（别名方案）
export default defineConfig({
  resolve: { alias: { react: 'preact/compat', 'react-dom': 'preact/compat' } }
})
```

## Notes / 说明
- 本项目为纯前端工具，无后端依赖，构建产物为 `dist/` 可离线托管的静态文件。
- 更多实现与规格细节见《开发文档.md》。
