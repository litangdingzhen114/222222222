# 一部手机游海林村后端设计

## 1. 现状与迁移原则

当前仓库已经包含两套可用界面和一套轻量后端：

- `miniprogram/`：微信小程序，当前通过 `/api/hailin/*` 获取内容并提交预约、反馈和订单。
- `backend/server.js`：零依赖 Node.js HTTP 服务，使用 JSON 文件保存预约、反馈、订单和审计记录。
- `backend/admin-src/`：React、Ant Design、React Query 管理端，当前请求 `/api/admin/*`。

现有服务适合演示和单机试运营，但没有用户身份、数据库事务、多角色权限、支付验签和多实例一致性。本次升级采用兼容迁移：

1. 保留 `backend/server.js`，作为旧版回退和行为对照，不删除现有数据与功能。
2. 在 `backend/src` 建立 NestJS 正式后端，主接口使用 `/api/v1`。
3. 新后端提供 `/api/hailin/*` 兼容入口，旧版小程序可继续运行；小程序逐步切换到 JWT 用户接口。
4. 管理端迁移到账号密码登录和 `/api/v1/admin/*`，过渡期保留旧路径映射。
5. 生产数据全部写入 PostgreSQL，Redis 只保存短期缓存、限流、幂等和刷新令牌状态，不把业务主数据放入缓存。

## 2. 架构

```text
微信小程序 / 管理后台
        |
    HTTPS / Nginx
        |
  NestJS REST API
        |
  +-----+----------------------+-------------------+
  |                            |                   |
PostgreSQL                  Redis             Integration Adapters
Prisma ORM          token/cache/rate-limit   WeChat/Pay/Ezviz/COS/LLM
```

NestJS 模块按业务边界划分。Controller 只处理协议转换和鉴权，Service 负责状态校验与事务，Prisma 负责持久化，第三方调用只能经 `integrations/` 适配器进入。

## 3. 模块划分

### 基础模块

- `config`：环境变量校验和强类型配置。
- `database`：Prisma 生命周期、事务和数据库健康检查。
- `common`：统一响应、异常过滤、requestId、日志、分页、鉴权、RBAC、脱敏和错误码。
- `health`：应用、PostgreSQL、Redis 健康检查。
- `audit-logs`：管理员重要操作审计。

### 用户与内容模块

- `auth`、`users`、`admins`、`addresses`：微信登录、管理员登录、JWT、刷新令牌轮换、资料和地址。
- `banners`、`articles`、`scenic-spots`、`travel-routes`、`map-points`：首页和文旅内容。
- `homestays`、`foods`、`farms`：乡村服务资源。
- `favorites`、`browsing-history`、`feedback`：用户行为和服务闭环。

### 交易模块

- `reservations`：预约项目、场次、订单、名额原子扣减和取消恢复。
- `activities`、`registrations`：活动、报名、重复报名限制和名额原子扣减。
- `categories`、`products`、`cart`：商品目录、购物车和库存展示。
- `orders`：价格复核、商品快照、库存原子扣减、幂等创建、发货、收货和超时关闭。
- `payments`：微信支付 API v3 下单、回调验签解密、金额校验和重复通知幂等。

### 能力模块

- `cameras`：萤石云设备、状态和临时播放地址。
- `uploads`：本地或腾讯云 COS 存储，统一文件安全检查。
- `ai-guide`：意图分类、数据库检索、上下文构造和 LLM/Fallback 回答。
- `notifications`：一期保留站内通知结构，后续可接订阅消息。

## 4. 数据模型

核心数据分为五组：

- 身份：`User`、`AdminUser`、`RefreshToken`。
- 内容：`Banner`、`HomeShortcut`、`Article`、`ScenicSpot`、`TravelRoute`、`TravelRouteSpot`、`MapPoint`、`Homestay`、`Food`、`Farm`、`Camera`。
- 预约活动：`ReservationItem`、`ReservationSlot`、`ReservationOrder`、`Activity`、`ActivityRegistration`。
- 商城交易：`ProductCategory`、`Product`、`CartItem`、`Address`、`Order`、`OrderItem`、`PaymentRecord`、`IdempotencyRecord`。
- 运营行为：`Favorite`、`BrowsingHistory`、`Feedback`、`AuditLog`、`Notification`。

金额使用 PostgreSQL `INTEGER`，单位为分。图片、标签和快照使用 `JSONB`；`MapPoint.imageUrl` 用于地图点位点击卡片的单张展示图。内容实体使用 `deletedAt` 软删除；订单和支付记录不提供物理删除接口。经纬度使用 `DECIMAL(10,7)`，API 输出时转换为数字。

## 5. 权限模型

角色：

- `USER`：小程序游客，只能访问自己的资料、地址、购物车、预约和订单。
- `CONTENT_OPERATOR`：管理首页、文章、景点、路线、地图、活动、直播和反馈。
- `MALL_OPERATOR`：管理分类、商品、商城订单、发货和退款状态。
- `ADMIN`：拥有内容和商城运营权限，并能查看用户和概览。
- `SUPER_ADMIN`：额外管理管理员账号和敏感系统配置。

JWT 中保存主体类型、主体 ID、角色和 tokenId，不保存密码、openid、session_key 或第三方凭证。`JwtAuthGuard` 负责身份校验，`RolesGuard` 负责 RBAC。服务层继续校验资源归属，避免只依赖路由 Guard。

## 6. 第三方服务

- 微信小程序：`WechatMiniProgramAdapter` 实现 `code2Session`。未配置凭证时仅开发环境允许显式 `dev:` code Mock，响应标记 `authMode=development_mock`。
- 微信支付：`WechatPayAdapter` 负责请求签名、平台证书验签和 AES-256-GCM 解密。没有商户配置时创建支付接口返回 `PAYMENT_PROVIDER_NOT_CONFIGURED`，不伪造支付成功。
- 萤石云：`EzvizAdapter` 从环境变量读取凭证，accessToken 缓存在 Redis，播放地址按设备短期缓存并限流。开发适配器返回明确的 `mode=development`。
- 高德地图：`AmapAdapter` 只封装服务端确实需要的地理编码能力；点位和附近计算默认由本地数据完成。
- 文件存储：`StorageAdapter` 有 Local 和 Tencent COS 两种实现，凭证只存在环境变量。
- AI：`LlmProvider` 是统一接口；无模型 Key 时，基于数据库检索生成规则化回答，并返回 `mode=fallback`。

## 7. 订单状态机

```text
PENDING_PAYMENT -> PAID -> PROCESSING -> SHIPPED -> COMPLETED
       |             |          |           |
       +----------> CANCELLED    +-------> REFUNDING -> REFUNDED
       +----------> CLOSED
```

- 创建订单时在同一事务内读取商品、复核价格、原子扣库存、写商品快照、创建订单和幂等记录。
- `PENDING_PAYMENT` 超时任务将订单置为 `CLOSED` 并恢复库存。
- 只有微信支付验签回调可以把 `paymentStatus` 更新为 `PAID`。
- 已支付订单不能由用户直接取消；进入退款流程，由有权限的管理员处理。
- 发货必须填写承运商和运单号，并记录审计日志。

## 8. 预约状态机

```text
PENDING_PAYMENT -> PAID -> CONFIRMED -> COMPLETED
       |             |          |
       +----------> CANCELLED -> REFUNDING -> REFUNDED
```

创建预约使用数据库事务和条件更新：只有 `bookedCount + quantity <= capacity` 时才更新场次并创建订单。未支付超时、允许取消的预约会恢复名额。活动报名采用同样的条件更新方式，并通过联合唯一约束限制同一用户重复有效报名。

## 9. 支付流程

1. 小程序提交业务订单 ID，后端从数据库读取真实金额。
2. 后端创建唯一 `PaymentRecord`，调用微信支付 JSAPI 下单并返回前端调起参数。
3. 微信回调到独立公开端点；后端用平台证书验证签名并解密资源。
4. 校验 appid、mchid、商户订单号、业务订单、金额和币种。
5. 在事务内锁定支付记录，幂等更新支付和业务订单；重复成功回调直接返回成功。
6. 回调日志脱敏保存，私钥、API v3 Key、session_key 不落库不打印。

## 10. 接口与兼容策略

- 正式用户接口：`/api/v1/*`。
- 正式管理接口：`/api/v1/admin/*`。
- Swagger：`/api/docs`，生产环境可通过变量关闭。
- 旧小程序兼容接口：`/api/hailin/*`，内部读取新版 Service，不再写 JSON 文件。
- 旧管理端接口：迁移后由前端改用 `/api/v1/admin/*`；过渡期保留必要的查询和处理别名。

所有正式接口返回：

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "requestId": "uuid",
  "timestamp": 0
}
```

分页 `data` 统一为 `list/page/pageSize/total/totalPages`，最大 `pageSize` 为 100。

## 11. 部署架构

Docker Compose 启动 PostgreSQL、Redis 和 NestJS。生产环境由 Nginx 终止 HTTPS，转发 `/api` 和 `/uploads` 到后端，并为 `/admin` 提供管理端静态资源。数据库迁移在应用发布前执行，不在多个应用实例启动时并发执行。

备份策略：每日 `pg_dump`、对象存储版本控制、Redis 不作为业务恢复源。恢复时先停止写流量，恢复 PostgreSQL，再校验迁移版本和订单/支付数量。

## 12. 本次新增与修改范围

主要新增：

- `backend/package.json`、Nest/TypeScript/Jest/ESLint 配置。
- `backend/src/**`、`backend/prisma/**`、`backend/test/**`。
- `backend/Dockerfile`、`backend/docker-compose.yml`、`backend/nginx/**`。
- `backend/.env.example` 和 `backend/README.md` 的生产配置与联调说明。

兼容性修改：

- 根 `package.json` 增加 workspace 和新版后端脚本，保留 legacy 脚本。
- 小程序请求层增加 accessToken、refreshToken 和 401 刷新能力，内容页面继续支持本地数据兜底。
- 管理端登录从静态 Token 迁移为账号密码 JWT，并改用 `/api/v1/admin`。

不会删除或移动 `miniprogram/`、`backend/server.js`、现有后台源码和已有本地素材。
