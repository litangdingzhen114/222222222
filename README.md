# 海林村文旅小程序与后台

浙江省丽水市青田县海口镇海林村文旅服务平台，包含微信小程序、真实后端接口、Kimi AI 导游代理、慢直播视频代理和运营后台管理页。

## 项目结构

- `miniprogram/`：微信小程序端
- `backend/`：零依赖 Node.js 后端与后台管理页
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

## 线上域名规划

- 原有 Vercel 网站继续使用 `https://www.sunmaosun.com`
- 海林村后端 API 和后台使用 `https://api.sunmaosun.com`
- 小程序合法 request 域名配置 `https://api.sunmaosun.com`
- 后台管理入口为 `https://api.sunmaosun.com/admin/`

## 生产环境变量

参考 `backend/.env.example`：

```text
NODE_ENV=production
PUBLIC_BASE_URL=https://api.sunmaosun.com
ALLOWED_ORIGINS=https://api.sunmaosun.com
ADMIN_TOKEN=replace-with-a-strong-random-token-at-least-24-characters
KIMI_API_KEY=replace-with-your-kimi-key
```

`KIMI_API_KEY` 只放在后端环境变量里，不放进小程序。

## 验证

```bash
npm test
```

当前后端使用文件型存储，适合试运营和轻量上线。长期生产运行建议迁移到数据库，并给上传媒体和慢直播接对象存储/CDN。
