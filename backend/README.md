# 一部手机游海林村 NestJS 后端

这是小程序和管理后台的正式后端工程，主接口为 `/api/v1`，兼容旧小程序的 `/api/hailin/*`。

## 本地开发

```bash
cd backend
cp .env.example .env
npm install
docker compose up -d postgres redis
npm run prisma:deploy
npm run prisma:seed
npm run start:dev
```

Swagger 地址：`http://127.0.0.1:8787/api/docs`。

健康检查：

```bash
curl http://127.0.0.1:8787/api/v1/health
curl http://127.0.0.1:8787/api/v1/health/database
curl http://127.0.0.1:8787/api/v1/health/redis
```

## 环境变量

`.env.example` 已列出全部配置。正式部署前必须配置：

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `SEED_ADMIN_PASSWORD`
- `WECHAT_APP_ID`、`WECHAT_APP_SECRET`
- `WECHAT_PAY_*`
- `EZVIZ_APP_KEY`、`EZVIZ_APP_SECRET`
- `TENCENT_COS_*`
- `LLM_API_KEY`

微信、微信支付、高德、腾讯云 COS、萤石云和模型密钥当前均为“等待正式凭证配置”。没有正式凭证时，微信登录和萤石云直播仅在非生产环境按显式开发模式运行；微信支付不会伪造支付成功。

## 数据库

迁移：

```bash
npm run prisma:deploy
```

生成 Prisma Client：

```bash
npm run prisma:generate
```

初始化数据：

```bash
npm run prisma:seed
```

Seed 会创建：

- 超级管理员：`SEED_ADMIN_USERNAME`
- 首页轮播和快捷入口
- 5 个景点、3 条路线、地图公共点位
- 3 个采摘项目和未来 7 天预约时段
- 3 个活动、3 个直播摄像头
- 商品分类、10 个农特产商品
- 村庄介绍、公告、游客须知、FAQ

生产环境如果未修改默认管理员密码，Seed 会拒绝执行。

## Docker 部署

```bash
cd backend
cp .env.example .env
docker compose up -d postgres redis
docker compose build api
docker compose run --rm api npm run prisma:deploy
docker compose run --rm api npm run prisma:seed
docker compose up -d api
```

小程序正式请求必须配置 HTTPS 域名，例如 `https://hailin.example.com/api/v1`。Nginx 示例在 `nginx/hailin.conf`，需要替换 `server_name` 和证书路径。

## 接口范围

核心用户端：

- `POST /api/v1/auth/wechat-login`
- `POST /api/v1/auth/refresh`
- `GET/PATCH /api/v1/users/me`
- `GET /api/v1/home`
- `GET /api/v1/scenic-spots`
- `GET /api/v1/travel-routes`
- `GET /api/v1/map-points/nearby`
- `POST /api/v1/reservations`
- `POST /api/v1/activities/:id/register`
- `POST /api/v1/cameras/:id/play-url`
- `GET/POST/PATCH/DELETE /api/v1/cart`
- `POST /api/v1/orders/preview`
- `POST /api/v1/orders`
- `POST /api/v1/payments/wechat/create`
- `POST /api/v1/ai-guide/chat`

管理端：

- `POST /api/v1/admin/auth/login`
- `GET /api/v1/admin/overview`
- `GET /api/v1/admin/users`
- `GET/POST/PATCH/DELETE /api/v1/admin/:resource`
- `POST /api/v1/admin/:resource/:id/publish`
- `POST /api/v1/admin/:resource/:id/offline`
- `POST /api/v1/admin/orders/:id/ship`
- `POST /api/v1/admin/orders/:id/refunding`
- `POST /api/v1/admin/orders/:id/refunded`
- `POST /api/v1/admin/feedback/:id/reply`
- `GET /api/v1/admin/audit-logs`

## 测试与质量

```bash
npm run lint
npm run build
npm run test
```

测试不会调用微信、微信支付、高德、萤石云或模型正式接口，必须使用 Mock Adapter。

## 备份与恢复

备份 PostgreSQL：

```bash
docker exec hailin-postgres pg_dump -U hailin hailin > backup.sql
```

恢复 PostgreSQL：

```bash
cat backup.sql | docker exec -i hailin-postgres psql -U hailin hailin
```

Redis 只保存 token、缓存、限流和幂等短期状态，不作为业务恢复源。上传文件需要同步备份 `uploads/` 或 COS Bucket。
