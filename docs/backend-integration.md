# 海林村小程序真实服务接入说明

## 小程序配置

小程序端只配置后端域名，不保存 AI Key、直播密钥或后台 Token。

文件：`miniprogram/config/service.js`

```js
apiBaseUrl: "https://api.hailin.store";
```

当前 Vercel 演示版后台继续使用 `https://www.hailin.store/admin/`。阿里云独立后端
`https://api.hailin.store` 的健康检查已经通过，小程序 API 域名默认指向独立 API。

本地开发可以使用：

```js
devApiBaseUrl: "http://127.0.0.1:8787";
```

真机预览时不要使用 `127.0.0.1`，需要换成电脑局域网 IP；正式上线必须使用 HTTPS 域名，并在微信公众平台配置合法 request 域名。

## 后端启动

```bash
npm run backend
```

健康检查：

```text
GET /api/v1/health
```

后台管理页：

```text
GET /admin/
```

## 小程序接口

- `GET /api/v1/home`
- `GET /api/v1/map-points`
- `GET /api/v1/foods`
- `GET /api/v1/cameras`
- `POST /api/v1/cameras/:id/play-url`
- `POST /api/v1/ai-guide/chat`
- `POST /api/v1/orders`
- `POST /api/v1/feedback`

小程序仍保留 `/api/hailin/*` 兼容接口，用于过渡部署，不作为新功能优先路径。

## AI 导游

`POST /api/hailin/ai-guide`

请求示例：

```json
{
  "message": "推荐一条半日路线",
  "history": [],
  "location": "浙江省丽水市青田县海口镇海林村",
  "context": ["瓯江", "青田石", "田鱼", "侨乡", "山水村落"]
}
```

后端通过统一 LLM Provider 调用模型服务。未配置正式 Key 时，接口会返回基于数据库内容的规则化导览建议，并明确标记为 fallback 模式；小程序端不展示“模型已正式接入”的误导文案。

Kimi 官方文档：https://platform.moonshot.cn/docs

## 后台管理

访问：

```text
https://www.hailin.store/admin/
```

登录使用 `/api/v1/admin/auth/login` 返回的管理员 JWT。后台支持：

- 看预约、反馈、AI、慢直播总览
- 按状态筛选预约和反馈
- 更新预约/反馈处理状态
- 导出预约和反馈 CSV
- 查看存储、运行时间、AI Provider 等系统健康信息
- 查看操作审计，追踪预约/反馈处理、导出和备份动作
- 下载完整 JSON 备份，包含预约、反馈和审计记录
- 列表默认脱敏显示联系方式，详情页用于实际处理时可复制完整联系方式

## 首页内容

小程序首页继续请求：

```text
GET /api/hailin/home
```

后台可维护首页 JSON 内容：

```text
GET /api/admin/home-content
PUT /api/admin/home-content
POST /api/admin/home-content/reset
```

可管理内容包含轮播、快捷入口、农品商品、热门推荐、榜单、长廊、游记流、公告、天气和服务状态。保存后会写入 `backend/storage/home-content.json`，并同步进入审计和完整备份。

## 慢直播

小程序从以下接口读取慢直播点位：

```text
GET /api/v1/cameras
POST /api/v1/cameras/:id/play-url
```

后台可维护慢直播点位、封面、排序、启停状态和真实播放源：

```text
GET /api/admin/lives
PUT /api/admin/lives
POST /api/admin/lives/reset
```

未配置萤石云正式凭证或设备不可用时，播放地址接口不会伪造真实直播；小程序显示点位封面和维护提示。接入真实摄像头后由后端适配器动态获取可播放地址，小程序端不保存萤石云密钥。

## 预约和反馈

预约、反馈、订单和操作日志由 NestJS + Prisma 写入 PostgreSQL；Redis 用于限流、幂等和第三方 token 缓存。旧 JSON 存储仅作为 Vercel 轻量后台兼容方案，不作为生产数据闭环。
