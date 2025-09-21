# 简浩影视 · 全栈后台管理系统

简浩影视是一套面向摄影工作室的全栈后台与官网解决方案，涵盖登录注册、角色与权限管理、预约/进度、摄影师与作品集、营销内容、统计仪表盘等模块，并提供与后台数据实时联动的响应式官网体验。

## 功能亮点

- 🔐 **认证与 RBAC**：JWT + HttpOnly Cookie，注册/登录/刷新/注销齐全，角色与权限多对多映射并实时生效。
- 👥 **成员与权限管理**：用户、角色、权限增删改查，登录设备写入审计日志，支持按角色过滤菜单。
- 📅 **核心业务模块**：项目、拍摄排期、客户预约、摄影师档案、服务套餐、作品集、站点内容一站式管理。
- 🛰️ **前后端联动官网**：React 公网站点（首页/作品/摄影师/服务/预约/进度查询）直接消费后端 API，所有更新实时同步。
- 📊 **仪表盘与统计**：Recharts 图表展示 KPI、预约漏斗、团队日程等指标，Framer Motion 微动画增强体验。
- 📜 **审计与合规**：关键操作自动落库，提供筛选、排序、追踪能力。
- ⚙️ **工程化**：Monorepo、TypeScript 全覆盖、ESLint + Prettier、Vitest 单测、OpenAPI 文档、Postman 集合。

### 前台体验亮点

- 🎞️ **高颜值官网**：Tailwind + shadcn/ui 构建的响应式首页，覆盖服务优势、作品精选、客户评价、FAQ 等内容。
- 🧑‍🤝‍🧑 **摄影师挑选**：按专题展示摄影师履历、擅长领域与社交链接，可从后台实时上下架。
- 🗓️ **在线预约与进度查询**：多步骤表单校验，提交后生成预约 reference + 访问口令；客户可凭此查看制作进度。
- 📱 **全端适配**：侧边栏分层、可折叠导航与响应式网格，确保桌面与移动端都有良好体验。

## 目录结构

```
├── apps
│   ├── backend          # Node.js 20 + Express + Prisma + PostgreSQL
│   │   ├── src          # 应用源码（模块化拆分）
│   │   ├── prisma       # 数据模型、迁移、种子脚本
│   │   └── docs         # OpenAPI 3.0 规范
│   └── frontend         # React 18 + Vite + Tailwind + shadcn/ui
│       ├── src          # 页面、组件、服务、路由
│       └── public       # 静态资源
├── collections          # Postman 示例集合
├── scripts              # 预留脚本目录
├── docker-compose.yml   # 开箱即用的 Postgres 服务
├── package.json         # 根工作区脚本（concurrently）
└── .env.example         # 环境变量示例
```

## 快速开始

### 1. 环境准备

- Node.js ≥ 20
- npm ≥ 9
- 本地或 Docker PostgreSQL（默认 `postgres:postgres@localhost:5432`）

### 2. 初始化项目

```bash
# 克隆仓库后
cp .env.example .env
# 根据需要修改数据库、端口等变量

npm install
npm run db:migrate     # prisma migrate deploy
npm run db:seed        # 写入示例数据、账号与演示项目
```

> 提供演示账号：
>
> - 管理员：`admin@jianhao.studio / changeme123`
> - 编辑：`editor@jianhao.studio / changeme123`
> - 观察者：`viewer@jianhao.studio / changeme123`
>
> 种子脚本会在控制台输出 2~3 条示例预约的 `reference` 与 `accessCode`，用于公众预约查询演示。

### 3. 启动前后端（本地开发）

```bash
# 同时启动前后端
npm run dev

# 或者单独启动
npm run dev --workspace apps/backend   # 后端：使用 tsx watch 热更新
npm run dev --workspace apps/frontend  # 前端：Vite 热更新
```

- 官网：<http://localhost:5173>（首页、作品、摄影师、服务、预约）
- 后台：<http://localhost:5173/admin>（登录后访问各管理模块）
- 后端 API：<http://localhost:8080>
- Swagger 文档（Basic Auth：docs/docs）：<http://localhost:8080/docs>

若端口占用，可在 `.env` 中调整 `FRONTEND_PORT` / `BACKEND_PORT`，或在运行命令时临时覆盖（如 `BACKEND_PORT=8081 npm run dev --workspace apps/backend`）。

### 4. 本地运行检查清单

1. PostgreSQL 可连接，数据库已创建。
2. `.env` 与数据库、Cookie、域名匹配。
3. `npm run db:migrate && npm run db:seed` 已执行成功。
4. 访问 `http://localhost:8080/healthz` 或调用登录接口确认 200 响应。
5. 使用演示账号登录后台 <http://localhost:5173/admin>，确认菜单、权限、数据表格及表单正常；访问官网 <http://localhost:5173> 验证作品、服务、预约与进度查询展示无误。

### 5. 生产构建

```bash
npm run build          # 前后端同时构建
npm run start          # 以构建产物启动（需预先构建）
```

`npm run start` 会并行执行 `npm:start --workspace apps/backend` 与 `npm:start --workspace apps/frontend`：

- 后端通过 `node dist/server.js` 启动，读取 `.env` 中的生产配置。
- 前端使用 Vite 预览构建产物（如需静态托管，可将 `apps/frontend/dist` 输出部署至任意静态服务）。

### 6. 宝塔（BT）面板部署指南

以下以一台安装了宝塔 Linux 面板的云服务器为例，演示完整部署流程：

1. **准备运行环境**
   - 在“软件商店”安装 Node.js 20.x、PM2 管理器（或使用面板的 Node 项目管理器）。
   - 安装 PostgreSQL 15+（可通过宝塔插件或使用 Docker：`docker run --name jianhao-pg -e POSTGRES_PASSWORD=强密码 -p 5432:5432 -d postgres:15`）。
   - 在安全组放通 5173/8080（如需对外访问，可通过反向代理隐藏原始端口）。

2. **拉取代码与安装依赖**
   - 在宝塔文件管理或 SSH 中执行：
     ```bash
     git clone https://your.git.repo.git /www/wwwroot/jianhao-studio
     cd /www/wwwroot/jianhao-studio
     cp .env.example .env
     # 根据生产环境修改 .env：
     # - BACKEND_DATABASE_URL 指向云端 PostgreSQL
     # - BACKEND_COOKIE_DOMAIN=yourdomain.com
     # - FRONTEND_API_BASE_URL=https://api.yourdomain.com/api/v1
     npm install
     ```

3. **初始化数据库**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **构建前后端**
   ```bash
   npm run build
   ```
   - 构建完成后，后端输出 `apps/backend/dist`，前端静态资源位于 `apps/frontend/dist`。

5. **配置后端服务（PM2）**
   - 在宝塔 PM2 管理器中新建应用：
     - 运行目录：`/www/wwwroot/jianhao-studio/apps/backend`
     - 启动文件：`dist/server.js`
     - 环境变量：引用项目根目录 `.env` 或在 PM2 里配置所需键值。
   - 启动后端并确认监听端口（默认为 8080，可通过 `.env` 调整）。

6. **部署前端静态站点**
   - 使用宝塔“网站”功能创建站点，将根目录指向 `apps/frontend/dist`。
   - 配置反向代理，将 `/api` 或 `/docs` 等请求转发到后端（如 `http://127.0.0.1:8080`）。
   - 若前后端使用不同域名，请在 `.env` 中确保 `FRONTEND_API_BASE_URL` 指向后端公网地址，并在后端启用 CORS（默认已开启 *）。

7. **HTTPS 与域名**
   - 在宝塔 SSL 选项中申请免费证书，将前端、后端（如通过 Nginx 代理）都配置为 HTTPS。
   - 更新 `.env` 的 `BACKEND_COOKIE_DOMAIN` 为主域名，确保 HttpOnly Cookie 跨域发送正常。

8. **运维建议**
   - 使用 `npm run db:migrate` 在发布前同步数据库结构。
   - PM2/宝塔计划任务定期备份数据库及 `.env`。
   - 通过 `/api/v1/audit-logs` 或前端审计页面查看操作记录，确保安全审计。

## 后端说明（apps/backend）

- **技术栈**：Express + Prisma + Zod DTO + JWT + Cookie + RBAC
- **目录组织**：按业务模块拆分（auth/users/roles/projects/sessions/bookings/photographers/services/portfolio/content/public/audit/stats）
- **API 前缀**：`/api/v1`
- **响应规范**：`{ data, message, error?, traceId? }`
- **OpenAPI 文档**：`apps/backend/docs/openapi.yaml`（Swagger-UI 挂载在 `/docs`）
- **数据库模型**：`prisma/schema.prisma`（User、Role、Permission、Photographer、Service、PortfolioItem、Booking、BookingProgress、SiteSetting、AuditLog、Project、Session、RefreshToken ...）
- **脚本**：
  - `npm run db:migrate`：迁移部署
  - `npm run db:seed`：写入演示数据（角色 + 账号 + 项目 + 会话）
  - `npm run db:push`：开发调试

## 前端说明（apps/frontend）

- **技术栈**：React 18、TypeScript、Vite、React Router、Tailwind CSS、shadcn/ui、TanStack Query、React Hook Form、Zod、Recharts、Framer Motion、Lucide Icons。
- **结构**：
  - `layouts/`：Dashboard 布局、Public Layout、主题切换、Sidebar
  - `pages/`：后台模块（仪表盘、项目、拍摄、预约、摄影师、服务、作品集、内容、用户、角色、审计）
  - `pages/public/`：官网页面（首页、作品集、摄影师、服务、预约、进度查询）
  - `components/ui/`：shadcn 风格基础组件
  - `services/`：Axios API 封装、类型定义、TanStack Query 钩子
  - `providers/`：AuthProvider & ThemeProvider
- **体验特性**：响应式布局、暗黑模式、乐观提示、表单校验、Loading Skeleton、微动画
- **测试**：`npm test --workspace apps/frontend` 使用 Vitest + Testing Library

## 常用脚本

```bash
npm run dev            # 前后端同时启动
npm run build          # 前后端构建
npm run start          # 并行启动构建产物
npm run lint           # ESLint 检查（前后端）
npm run test           # Vitest / 单元测试
npm run db:migrate     # 运行 Prisma 迁移
npm run db:seed        # 载入演示数据
```

## 审计与安全

- 每次增删改操作自动记录到 `AuditLog` 表，可在前端“审计日志”模块查看。
- 管理员可通过角色模块动态调整权限，前端菜单与接口联动隐藏。
- JWT Access Token（15 分钟）+ Refresh Token（7 天）存储于 HttpOnly Cookie，前端仅保留用于请求头的 Access Token 缓存。

## Postman 集合

`collections/jianhao-admin.postman_collection.json` 提供常用接口示例，导入后修改 `baseUrl` 即可调试。

## 截图（示例）

> 可选：运行 `npm run dev` 后体验官网（首页/作品/摄影师/服务/预约）与后台（仪表盘、项目、排期、预约、摄影师、服务、作品集、内容、成员、角色、审计等页面）。

---

如需自定义品牌视觉、拓展业务实体（如合同、发票、素材库等），可在现有模块基础上继续扩展。
