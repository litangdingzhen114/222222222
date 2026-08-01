# 海林村文旅小程序与后台

浙江省丽水市青田县海口镇海林村文旅服务平台，包含微信小程序、真实后端接口、Kimi AI 导游代理、慢直播视频代理和运营后台管理页。

## 项目结构

- `miniprogram/`：微信小程序端
- `backend/`：NestJS 正式后端、阿里云部署配置、临时演示适配层与后台管理页
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

## 线上域名策略

- 正式主后端：`https://api.hailin.store`，部署在阿里云 ECS，等待 ICP/HTTPS 完整放通后作为唯一生产 API。
- 临时演示兜底：`https://www.hailin.store`，仅在 `api.hailin.store` 不可用时给微信开发者工具、审核演示和图片资源过渡使用。
- 后台管理正式入口应随阿里云后端发布，例如 `https://api.hailin.store/admin/`；`https://www.hailin.store/admin/` 仅作为过渡演示入口。
- 小程序合法 request/upload/download 域名现阶段配置 `https://www.hailin.store`；`api.hailin.store` 放通后切换为主域名并保留 `www` 做短期兜底。

## 生产环境变量

参考 `backend/.env.example`：

```text
NODE_ENV=production
PUBLIC_BASE_URL=https://api.hailin.store
ALLOWED_ORIGINS=https://www.hailin.store,https://hailin.store,https://api.hailin.store
ADMIN_TOKEN=replace-with-a-strong-random-token-at-least-24-characters
KIMI_API_KEY=replace-with-your-kimi-key
KIMI_MODEL=moonshot-v1-8k
```

`KIMI_API_KEY` 只放在后端环境变量里，不放进小程序。

## 验证

```bash
npm test
```

当前轻量兼容层仍可用于演示。正式上线以阿里云上的 NestJS + PostgreSQL + Redis 为准，并给上传媒体和慢直播接对象存储/CDN。

## 临时演示兜底

仓库仍保留根目录 `api/index.js` 和 `vercel.json`，只用于 `api.hailin.store` 未完成备案/HTTPS 放通时的临时演示兜底。不要把它作为最终生产数据闭环。

Vercel 项目设置建议：

```text
Framework Preset: Other
Root Directory: 留空或仓库根目录
Install Command: npm install
Build Command: npm run build
Output Directory: 留空
```

如果确实需要启用临时兜底项目，不要把 Root Directory 设置成 `backend`。入口文件在仓库根目录 `api/index.js`，如果只部署 `backend` 子目录，会绕开根目录 `vercel.json`，临时演示域名可能出现 `DEPLOYMENT_NOT_FOUND` 或路由 404。

生产环境变量至少需要：

```text
NODE_ENV=production
PUBLIC_BASE_URL=https://www.hailin.store
ALLOWED_ORIGINS=https://www.hailin.store,https://hailin.store
ADMIN_TOKEN=replace-with-a-strong-random-token-at-least-24-characters
KIMI_API_KEY=replace-with-your-kimi-key
KIMI_MODEL=moonshot-v1-8k
```

在临时兜底环境没有显式设置 `STORAGE_DIR` 时，函数会使用 `/tmp/hailin-storage`。这只适合预览和轻量演示，数据可能随实例回收或重新部署丢失。正式运营前必须使用阿里云 PostgreSQL/Redis 或托管存储保存预约、反馈、审计、后台配置和第三方 Key。
