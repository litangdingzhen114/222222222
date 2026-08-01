# 微信小程序上线检查清单

## 当前域名策略

- 正式主后端：`https://api.hailin.store`（阿里云 ECS，等待 ICP/HTTPS 完整放通）
- 临时演示兜底：`https://www.hailin.store`（仅在 `api.hailin.store` 不可用时使用）
- 后台正式入口：`https://api.hailin.store/admin/`（随阿里云后端发布）
- 过渡后台入口：`https://www.hailin.store/admin/`（只用于演示，不作为长期生产）

## 阿里云 ECS

1. ECS 安全组只开放 `22`、`80`、`443`。
2. `api.hailin.store` A 记录指向 ECS 公网 IP。
3. 如果 ECS 在中国内地，确认 `hailin.store` 已完成 ICP 备案。
4. 服务器安装 Docker 与 Docker Compose。
5. 复制 `backend/.env.example` 为 `backend/.env`，生产环境至少填写：
   - `NODE_ENV=production`
   - `PUBLIC_BASE_URL=https://api.hailin.store`
   - `ALLOWED_ORIGINS=https://www.hailin.store,https://hailin.store`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `POSTGRES_PASSWORD`
   - `SEED_ADMIN_PASSWORD`
   - `WECHAT_APP_ID`
   - `WECHAT_APP_SECRET`
6. 执行：

```bash
docker compose -f docker-compose.production.yml up -d --build
docker compose -f docker-compose.production.yml run --rm migrator
```

7. 配置 HTTPS 证书。`api.hailin.store` 未放通前，临时演示域名先确认：

```bash
curl https://www.hailin.store/health
curl https://www.hailin.store/api/v1/home
```

`api.hailin.store` 完成 ICP/HTTPS 放通后，补充确认：

```bash
curl https://api.hailin.store/health
curl https://api.hailin.store/api/v1/home
```

## 微信公众平台

在“小程序后台 - 开发管理 - 开发设置 - 服务器域名”配置：

- 当前临时演示：
  - `request 合法域名`：`https://www.hailin.store`
  - `uploadFile 合法域名`：`https://www.hailin.store`
  - `downloadFile 合法域名`：`https://www.hailin.store`
- 正式切换后：
  - `request 合法域名`：`https://api.hailin.store`
  - `uploadFile 合法域名`：`https://api.hailin.store`
  - `downloadFile 合法域名`：`https://api.hailin.store`

`https://www.hailin.store` 只做临时演示和图片资源兜底。`api.hailin.store` 完成备案与 HTTPS 后，小程序请求主链路切回阿里云。

发布前确认：

- `project.config.json` 使用真实 AppID。
- 开发联调阶段 `project.config.json` 可以使用 `urlCheck: false`，避免开发者工具拦截 `https://www.hailin.store`。
- 提交审核前必须确认微信公众平台已配置 `https://www.hailin.store` 为 request/upload/download 合法域名，真机预览不依赖开发工具域名豁免。
- 真机预览能正常打开首页、登录、地图、商城、订单、预约、反馈和后台配置内容。

## 等待正式凭证

这些不是代码阻塞项，但正式经营前需要补齐：

- 微信小程序 AppID / AppSecret
- 微信支付商户号、API v3 key、商户证书、支付回调域名
- 萤石云 AppKey / AppSecret / 正式设备
- 高德 Key
- 文件存储 COS 配置
- AI Provider Key
