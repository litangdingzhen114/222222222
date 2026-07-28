# 一部手机游海林村部署说明

## 1. 服务器

推荐阿里云 ECS：

- Ubuntu 22.04 LTS
- 2 核 4G 起步，正式运营建议 4 核 8G
- 系统盘 40G，数据盘按图片和日志规模扩容
- 安全组只开放 22、80、443

安装 Docker 与 Compose：

```bash
curl -fsSL https://get.docker.com | bash
systemctl enable --now docker
docker compose version
```

## 2. 环境变量

复制模板：

```bash
cp backend/.env.example backend/.env
```

生产必改：

```text
NODE_ENV=production
PUBLIC_BASE_URL=https://api.hailin.store
ALLOWED_ORIGINS=https://www.hailin.store,https://hailin.store
DATABASE_URL=postgresql://hailin:<强密码>@postgres:5432/hailin?schema=public
REDIS_URL=redis://redis:6379/0
JWT_ACCESS_SECRET=<32位以上随机字符串>
JWT_REFRESH_SECRET=<32位以上随机字符串>
SEED_ADMIN_PASSWORD=<首次管理员强密码>
```

第三方凭证等待正式资料后填写：

- `WECHAT_APP_ID`、`WECHAT_APP_SECRET`
- `WECHAT_PAY_APP_ID`、`WECHAT_PAY_MCH_ID`、`WECHAT_PAY_API_V3_KEY`
- `EZVIZ_APP_KEY`、`EZVIZ_APP_SECRET`
- `AMAP_KEY`
- `TENCENT_COS_SECRET_ID`、`TENCENT_COS_SECRET_KEY`
- `LLM_API_KEY`

不要提交 `backend/.env`、私钥、证书或真实 token。

## 3. 启动服务

在仓库根目录准备 Compose 变量：

```bash
export POSTGRES_DB=hailin
export POSTGRES_USER=hailin
export POSTGRES_PASSWORD='<数据库强密码>'
docker compose -f docker-compose.production.yml up -d --build
```

确认容器：

```bash
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs -f api
```

## 4. 数据库初始化

首次上线执行迁移和种子。生产 Compose 已内置 `migrator` 工具服务，会在 Docker 内网访问数据库，不需要暴露 PostgreSQL 端口：

```bash
docker compose -f docker-compose.production.yml run --rm migrator
```

本地开发仍可在根目录执行：

```bash
npm run db:migrate
npm run db:seed
```

## 5. 域名与 HTTPS

DNS 建议：

- `www.hailin.store` 指向 Vercel 管理后台展示域名
- `api.hailin.store` 指向阿里云 ECS 公网 IP

证书可以使用 Certbot。证书路径需匹配 `backend/nginx/hailin.production.conf`：

```text
/etc/letsencrypt/live/hailin.store/fullchain.pem
/etc/letsencrypt/live/hailin.store/privkey.pem
```

微信小程序正式请求必须在微信公众平台配置 HTTPS 合法域名，例如：

```text
https://api.hailin.store
https://www.hailin.store
```

## 6. 健康检查

```bash
curl https://api.hailin.store/health
curl https://api.hailin.store/api/v1/health
```

期望返回：

```json
{
  "data": {
    "api": "ok",
    "database": "ok",
    "redis": "ok"
  }
}
```

## 7. 备份恢复

每日备份 PostgreSQL：

```bash
docker compose -f docker-compose.production.yml exec postgres pg_dump -U hailin hailin > backups/hailin-$(date +%F).sql
```

恢复前停止写入流量：

```bash
docker compose -f docker-compose.production.yml stop api
docker compose -f docker-compose.production.yml exec -T postgres psql -U hailin hailin < backups/hailin-2026-07-27.sql
docker compose -f docker-compose.production.yml start api
```

上传文件在 `hailin-uploads` volume；日志在 `hailin-logs` volume。正式图片建议切腾讯云 COS。

## 8. 当前上线策略

Vercel 继续用于 `www.hailin.store/admin/` 的展示和轻量管理；长期运营数据应切到 NestJS + PostgreSQL + Redis 闭环。生产环境默认关闭微信登录和萤石云 mock；缺少正式凭证时，对应接口应返回等待配置或服务暂不可用，不伪造正式接入成功。只有本地预览或临时审核包可以显式开启开发 fallback。
