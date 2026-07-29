# 海林村文旅小程序与后台

浙江省丽水市青田县海口镇海林村文旅服务平台，包含微信小程序、真实后端接口、Kimi AI 导游代理、慢直播视频代理和运营后台管理页。

## 项目结构

- `miniprogram/`：微信小程序端
- `backend/`：NestJS 正式后端、Vercel 轻量适配层与后台管理页
- `backend/admin/`：后台管理页静态资源
- `docs/`：上线、接口和运维说明

## 本地启动

```bash
npm run backend
```

默认地址：

```text
http://127.0.0.1:8787
```

后台入口：

```text
http://127.0.0.1:8787/admin/
```

后台管理页源码位于 `backend/admin-src/`，使用 Vite、React、Ant Design、React Router 和 TanStack Query。开发后台前端可运行：

```bash
npm run admin:dev
```

构建后台静态资源到 `backend/admin/`：

```bash
npm run admin:build
```

## 线上域名规划

- 当前 Vercel 演示和后台使用 `https://www.hailin.store`
- 阿里云生产 API 使用 `https://api.hailin.store`
- 小程序合法 request/upload/download 域名配置 `https://api.hailin.store`
- 后台管理入口为 `https://www.hailin.store/admin/`

## 生产环境变量

参考 `backend/.env.example`：

```text
NODE_ENV=production
PUBLIC_BASE_URL=https://www.hailin.store
ALLOWED_ORIGINS=https://www.hailin.store,https://hailin.store
ADMIN_TOKEN=replace-with-a-strong-random-token-at-least-24-characters
KIMI_API_KEY=replace-with-your-kimi-key
KIMI_MODEL=moonshot-v1-8k
```

`KIMI_API_KEY` 只放在后端环境变量里，不放进小程序。

## 验证

```bash
npm test
```

当前后端使用文件型存储，适合试运营和轻量上线。长期生产运行建议迁移到数据库，并给上传媒体和慢直播接对象存储/CDN。

## Vercel 部署

仓库 `litangdingzhen114/222222222` 已经包含根目录 `api/index.js` 和 `vercel.json`，可以作为 Vercel Project 从 GitHub 导入。Vercel 会把 `/health`、`/api/*`、`/admin/*`、`/assets/*` 转发给同一个 Node.js Function，`/media/*` 慢直播演示视频由后台构建产物静态发布。

Vercel 项目设置建议：

```text
Framework Preset: Other
Root Directory: 留空或仓库根目录
Install Command: npm install
Build Command: npm run build
Output Directory: 留空
```

不要把 Root Directory 设置成 `backend`。当前 Vercel 入口文件在仓库根目录 `api/index.js`，如果只部署 `backend` 子目录，Vercel 会绕开根目录 `vercel.json`，生产域名可能出现 `DEPLOYMENT_NOT_FOUND` 或路由 404。

生产环境变量至少需要：

```text
NODE_ENV=production
PUBLIC_BASE_URL=https://www.hailin.store
ALLOWED_ORIGINS=https://www.hailin.store,https://hailin.store
ADMIN_TOKEN=replace-with-a-strong-random-token-at-least-24-characters
KIMI_API_KEY=replace-with-your-kimi-key
KIMI_MODEL=moonshot-v1-8k
```

在 Vercel 上没有显式设置 `STORAGE_DIR` 时，函数会使用 `/tmp/hailin-storage`。这只适合预览和轻量演示，数据可能随实例回收或重新部署丢失。后台“系统设置”里填写的第三方 Key 也是同理：正式保存请优先使用 Vercel 环境变量，或接入 Vercel KV / Upstash，并配置 `KV_REST_API_URL`、`KV_REST_API_TOKEN`、`CONFIG_STORE_KEY`。正式运营前应迁移预约、反馈、审计和日志到数据库或托管存储。
