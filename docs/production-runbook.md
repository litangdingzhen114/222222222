# 海林村上线运行手册

## 上线前配置

1. 准备 HTTPS API 域名：当前 Vercel 演示使用 `https://www.hailin.store`，阿里云生产 API 建议使用 `https://api.hailin.store`。
2. 在微信公众平台配置 request 合法域名。
3. 在服务器创建 `backend/.env`。
4. 设置强随机 `ADMIN_TOKEN`，不要使用开发默认 Token。
5. 设置 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`。
6. 确认 `miniprogram/config/service.js` 的 `apiBaseUrl` 指向当前可用 HTTPS 后端。

## 推荐环境变量

```text
NODE_ENV=production
HOST=0.0.0.0
PORT=8787
PUBLIC_BASE_URL=https://api.hailin.store
STORAGE_DIR=backend/storage
ALLOWED_ORIGINS=https://www.hailin.store,https://hailin.store
ADMIN_USER=hailin-admin
ADMIN_TOKEN=换成强随机Token
KIMI_API_KEY=你的KimiKey
KIMI_MODEL=moonshot-v1-8k
```

如果希望在 Vercel 后台页面直接保存第三方 Key 并跨冷启动保留，请在 Vercel Storage 中接入 KV / Upstash，并增加：

```text
KV_REST_API_URL=你的KV REST URL
KV_REST_API_TOKEN=你的KV写入Token
CONFIG_STORE_KEY=hailin:integration-configs
```

## 运行

```bash
npm run backend
```

## Vercel 部署

可以把 GitHub 仓库 `https://github.com/litangdingzhen114/222222222` 导入 Vercel。仓库内的根目录 `api/index.js` 会作为 Node.js Function 入口，根目录 `vercel.json` 会把 `/health`、`/api/*`、`/admin/*`、`/assets/*` 转发到后端函数；`/media/*` 慢直播演示视频由后台构建产物静态发布。

Vercel 项目设置：

```text
Framework Preset: Other
Root Directory: 留空或仓库根目录
Install Command: npm install
Build Command: npm run build
Output Directory: 留空
```

不要把 Root Directory 设置成 `backend`，否则 Vercel 不会读取根目录 `api/index.js` 和 `vercel.json`。

Vercel 环境变量：

```text
NODE_ENV=production
PUBLIC_BASE_URL=https://www.hailin.store
ALLOWED_ORIGINS=https://www.hailin.store,https://hailin.store
ADMIN_TOKEN=换成强随机Token
KIMI_API_KEY=你的KimiKey
KIMI_MODEL=moonshot-v1-8k
```

Vercel Function 默认使用 `/tmp/hailin-storage` 作为临时文件存储，只适合预览。后台页面会显示当前第三方 Key 的保存模式：`kv` 表示可持久，`volatile` 表示可能冷启动丢失。正式运营需要迁移到数据库/托管存储，否则预约、反馈、审计以及后台填写的 Key 都可能丢失。

后台入口：

```text
https://www.hailin.store/admin/
```

健康检查：

```text
https://www.hailin.store/health
```

## 运维关注

- `backend/storage/bookings.json`：预约数据
- `backend/storage/feedback.json`：反馈数据
- `backend/storage/audit.json`：后台操作审计
- `backend/storage/logs/`：请求日志
- `/health`：存储是否可写、AI 是否启用、后台 Token 是否配置
- 后台系统健康面板：正式域名、HTTPS、后台 Token、CORS 限制是否处于生产安全状态
- 后台快捷操作：每天或重要活动前后下载一次完整 JSON 备份
- 后台操作审计：排查误操作、批量处理和导出动作时优先查看

## 后续建议

文件存储适合试运营。正式长期运营建议升级为数据库，并增加多管理员账号体系、备份恢复、直播流鉴权和对象存储/CDN。
