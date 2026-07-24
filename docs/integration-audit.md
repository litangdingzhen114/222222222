# 一部手机游海林村集成审计

基线提交：`a3cc593 feat: add production NestJS backend`

审计时间：2026-07-24

## 1. 当前已有能力

- 仓库已在 `main` 分支，`git pull` 后无远端新提交，工作区开始时干净。
- 后端已有正式 NestJS 工程：`backend/src`，主接口为 `/api/v1`，兼容旧小程序 `/api/hailin/*`。
- 后端已具备 Prisma、PostgreSQL、Redis、JWT、RBAC、Swagger、Docker、Nginx、seed、migration 和 Jest 测试。
- 业务模块已覆盖登录、用户、首页、景点、路线、地图点位、采摘预约、活动报名、直播、商城、购物车、订单、支付结构、收藏、浏览记录、反馈、AI 导游和管理端 API。
- 管理后台源码存在于 `backend/admin-src/`，技术栈为 React、TypeScript、Vite、Ant Design、React Router、TanStack Query；构建产物位于 `backend/admin/`。
- 小程序已有统一请求入口 `miniprogram/services/api.js`，内容读取集中在 `miniprogram/services/content.js`，并保留本地 fallback 数据。
- 地图点位已支持后端 `MapPoint.imageUrl`，旧接口 `/api/hailin/map-points` 可返回小程序可直接使用的数组、`markerId` 和图片字段。

## 2. 管理后台现状与缺失页面

现有后台页面：

- `DashboardPage`
- `HomeContentPage`
- `ResourceContentPage`
- `LiveContentPage`
- `OrdersPage`
- `BookingsPage`
- `FeedbackPage`
- `AuditPage`
- `SystemPage`
- `LoginPage`

主要缺口：

- 登录仍是输入静态 token 思路，文案和类型仍指向 `ADMIN_TOKEN`，未接入 `/api/v1/admin/auth/login`。
- 请求仍调用旧 `/api/admin/*`，未迁移到 `/api/v1/admin/*`。
- 旧后台把景点、路线、美食、地图、商品聚合在 `ResourceContentPage`，缺少成熟运营台所需的独立列表、筛选、表单和状态操作。
- 缺少按 RBAC 动态菜单、路由权限、按钮权限和 403 页面。
- 缺少真实数据概览图表、系统配置状态聚合页、图片上传组件、金额元/分工具、统一状态映射。
- 订单、预约、活动、商品等页面未按新 Prisma 业务模型展示完整状态和详情。

## 3. 小程序仍使用静态数据的页面

后端优先但仍有本地 fallback 的页面：

- 首页：`pages/home/home.js` 通过 `loadHomeData()`，fallback 来自 `data/banners`、`data/homeGrids`、`data/recommend`、`data/products`。
- 景点列表/详情：`pages/spot-list`、`pages/spot-detail` 使用 `loadSpots()`，fallback 来自 `data/spots`。
- 路线列表/详情：`pages/route-list`、`pages/route-detail` 使用 `loadRoutes()`，fallback 来自 `data/routes`。
- 地图：`pages/map` 使用 `loadMapPoints()`，同时使用 `data/mapFeatures` 作为筛选和路线推荐配置。
- 美食：`pages/food` 使用 `loadFoods()`，fallback 来自 `data/foods`。
- 直播：`pages/live-list`、`pages/live-detail` 使用 `loadLives()`，fallback 来自 `data/lives` 和部分 `data/recommend`。
- 订单列表/详情：使用 `/api/hailin/orders` 兼容接口，同时合并 `utils/userCenter` 本地订单。

主要仍为本地状态的页面：

- 个人中心：`pages/mine`、`utils/userCenter.js`、`data/user.js`。
- 用户资料编辑：`pages/profile-edit`。
- 我的功能详情、收藏、任务、积分、发布内容：`pages/mine-feature`、`pages/user-list`、`pages/publish`。
- 预约/报名入口目前多走旧订单/反馈兼容提交，未按 `/api/v1/reservations`、`/api/v1/activities/:id/register` 完整联调。
- AI 导游页面已有 `services/ai.js`，但仍有本地规则 fallback。

## 4. 接口字段不一致问题

- 新后端分页接口返回 `{ list, page, pageSize, total, totalPages }`，旧小程序页面多数期望数组；地图页已做兼容，其它页面还需要统一适配。
- 新后端使用英文枚举状态，如 `PENDING_PAYMENT`、`ON_SALE`、`PUBLISHED`；旧前端使用 `new`、`confirmed`、`enabled` 等旧状态。
- 新后端金额统一为整数分；旧小程序部分字段仍是字符串价格，如 `price: "¥88"`。
- 新后端 `id` 多为字符串；微信地图 marker 需要数字 id。地图页已用 `markerId` 解决，其它页面仍需检查。
- 后台旧 API 的 `items` 分页结构与新 `/api/v1` 的 `list` 分页结构不同。
- 旧后台登录依赖 `x-admin-token` 或静态 token；新后端要求 JWT `Authorization: Bearer <accessToken>`。
- 图片字段命名存在 `imageUrl`、`coverImage`、`coverUrl`、`images`、`imageClass` 混用，需要前端统一资源 URL 工具。

## 5. 需要新增的少量后端接口

- `GET /api/v1/admin/dashboard`：管理端聚合统计、7 天趋势、状态分布、热门景点和热销商品。
- `GET /api/v1/admin/config-status`：PostgreSQL、Redis、微信、微信支付、萤石云、高德、存储、LLM 配置状态。
- `GET /api/v1/admin/:resource/:id`：后台通用资源详情，避免前端为编辑表单拉全量列表。
- `POST /api/v1/admin/reservation-orders/:id/confirm`、`POST /api/v1/admin/reservation-orders/:id/verify`：预约确认与核销。
- `POST /api/v1/admin/activity-registrations/export` 或 CSV 下载接口：报名名单导出。
- `POST /api/v1/payments/dev/confirm`：非生产环境开发支付模拟，必须后端校验订单、金额、幂等和环境。

## 6. 需要调整的前端文件

管理后台：

- `backend/admin-src/src/api.ts`：改为环境 baseURL、JWT、refresh、统一解包、分页适配、上传。
- `backend/admin-src/src/auth.tsx`：保存 accessToken、refreshToken、管理员信息和角色。
- `backend/admin-src/src/App.tsx`：动态菜单、受保护路由、403/404、面包屑。
- `backend/admin-src/src/types.ts`：重建状态映射、分页、后端资源类型、金额类型。
- `backend/admin-src/src/pages/*`：从旧 `/api/admin/*` 页面迁移到 `/api/v1/admin/*` 页面。
- `backend/admin-src/src/utils.ts`：金额元/分转换、状态颜色、资源 URL、CSV 导出。

小程序：

- `miniprogram/config/service.js`：优先配置 `/api/v1`，旧 `/api/hailin/*` 只保留兼容。
- `miniprogram/services/api.js`：补 Token、微信登录、刷新、分页、Loading、错误处理。
- `miniprogram/services/content.js`：增加字段适配函数，减少页面内兼容判断。
- `miniprogram/pages/home`、`spot-*`、`route-*`、`map`、`live-*`、`food`、`order-*`、`booking`、`mine-*`：逐页替换本地数据或降级为明确 fallback。
- `miniprogram/utils/format.js`：补金额分/元转换、订单状态统一展示。
- `miniprogram/tests/*`：补真实 API 字段适配、金额、订单、地图 id 和空数据测试。

## 7. 风险项

- 当前后台旧测试仍断言 `/api/admin/*`，迁移后台到 `/api/v1` 时需要同步测试，否则根目录 `npm run test` 会失败。
- 旧 `backend/server.js` 仍存在并服务 `/api/admin/*`、`/api/hailin/*`，容易与新 Nest 后端混淆。短期保留，但新开发不继续扩展旧接口。
- 管理后台要直接编辑 Prisma 通用资源，前端必须过滤不可写字段，后端也要继续清洗 `id`、时间戳、密钥和密码字段。
- 正式第三方凭证缺失，支付、萤石云、微信登录、LLM 只能显示开发模式或等待凭证，不能伪造正式成功。
- 小程序真机不能访问 `127.0.0.1`，README 需要明确局域网 IP 或 HTTPS 测试域名配置方式。
- 大量小程序页面依赖本地 `userCenter`，一次性替换风险高，需要先替换内容和交易主链路。

## 8. 本阶段执行顺序

1. 后台先迁移登录、API Client、JWT refresh、RBAC 菜单和布局。
2. 后端补 `admin/dashboard`、`admin/config-status`、资源详情、预约确认/核销、开发支付模拟等少量接口。
3. 后台完成数据概览、景点、地图点位、商品、订单、预约订单、活动报名核心页面。
4. 小程序先切换首页、景点、路线、地图、直播、商品列表/详情到 `/api/v1` 适配层；保留明确 fallback。
5. 跑通商城订单：登录、地址、购物车、预览、创建、取消恢复库存、开发支付模拟、后台发货、确认收货。
6. 跑通采摘预约和活动报名：名额扣减、取消恢复、重复报名限制、后台查看/确认/导出。
7. 补管理后台和小程序测试，更新 README/Docker/Nginx。
8. 每阶段运行相关 lint/build/test 后按阶段提交并推送。
