# 大牛

大牛是一套面向中小企业本地部署的 AI 专家系统。当前仓库包含官网、登录页、控制台前端，以及可用于生产落地的最小后端：登录会话、知识库上传与检索、模型路由、审计日志、健康检查和 Docker 部署。

## 本地开发

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开 `http://localhost:3000`。

## 关键环境变量

真实密钥只放在 `.env.local` 或部署平台 Secret 中，不要提交到 Git。

| 变量 | 说明 |
| --- | --- |
| `DANIU_ADMIN_ACCOUNT` | 本地管理员账号 |
| `DANIU_ADMIN_PASSWORD` | 本地管理员密码，生产环境必须修改 |
| `DANIU_SESSION_SECRET` | 会话签名密钥，生产环境至少 32 位随机字符串 |
| `DANIU_STORAGE_DIR` | 知识库、上传文件、审计日志存储目录 |
| `DEEPSEEK_API_KEY` | DeepSeek API Key，自动模式优先使用 |
| `DEEPSEEK_MODEL` | DeepSeek 模型，默认 `deepseek-v4-pro` |
| `MINIMAX_API_KEY` | MiniMax API Key，自动模式第二优先级 |
| `DANIU_LOCAL_LLM_BASE_URL` | 本地大模型 OpenAI 兼容接口地址 |
| `DANIU_LOCAL_LLM_API_KEY` | 本地大模型 API Key |
| `DANIU_LOCAL_LLM_MODEL` | 本地大模型名称 |
| `DANIU_AUTO_PROVIDER_ORDER` | Auto 模式路由顺序，默认 `deepseek,minimax,local` |
| `GITHUB_TOKEN` | 可选，用于提高 GitHub Skill 导入的 API 限额或读取私有仓库 |
| `DANIU_ENABLE_DEMO_DATA` | 是否启用内置演示知识，生产默认关闭 |
| `DANIU_MAX_UPLOAD_MB` | 单文件上传大小限制 |
| `DANIU_CHAT_RATE_LIMIT` | 每个窗口内的问答请求上限 |

## 后端能力

- `POST /api/auth/login`：账号密码登录，设置 HttpOnly 会话 Cookie。
- `POST /api/auth/logout`：退出登录并写入审计日志。
- `GET /api/auth/me`：查询当前登录用户。
- `POST /api/chat`：问大牛，自动检索企业知识库并调用 DeepSeek、MiniMax 或本地模型。
- 模型 Auto 路由优先级由 `DANIU_AUTO_PROVIDER_ORDER` 控制，默认 DeepSeek → MiniMax → 本地大模型。
- `GET /api/knowledge`：读取资料列表和知识库统计。
- `POST /api/knowledge/upload`：上传资料，校验数量、大小和扩展名后写入本地知识库。
- `GET /api/knowledge/search`：检索知识库片段。
- `GET /api/skills`：读取内置大牛视角和已导入的 GitHub Skill。
- `POST /api/skills/github/preview`：预览 GitHub 仓库、目录或 `SKILL.md` 中可导入的视角。
- `POST /api/skills/github/import`：将预览项保存为大牛视角，聊天页可直接启用。
- `GET /api/models/status`：登录后查看模型路由和生产就绪状态。
- `GET /api/health`：健康检查，用于部署探针。

## 生产部署

### Docker + Nginx

服务器推荐目录：

```text
/opt/daniu/app          # Git 工作树
/etc/daniu/daniu.env   # 生产环境变量，不进 Git
/data/daniu            # 知识库、上传文件、审计日志、导入的 Skill
```

首次初始化：

```bash
bash deploy/server-bootstrap.sh
git clone https://github.com/Jackma-labs/daniu_website.git /opt/daniu/app
cp /opt/daniu/app/deploy/nginx-daniu.conf /etc/nginx/sites-available/daniu
ln -sf /etc/nginx/sites-available/daniu /etc/nginx/sites-enabled/daniu
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

把生产密钥写入 `/etc/daniu/daniu.env`，然后部署：

```bash
cd /opt/daniu/app
bash deploy/production-deploy.sh
```

后续更新闭环：

```bash
# 本地
git push origin main

# 服务器
cd /opt/daniu/app
bash deploy/production-deploy.sh
```

```bash
docker build -t daniu:latest .
docker run -d \
  --name daniu \
  -p 3000:3000 \
  -v daniu-data:/data/daniu \
  --env-file .env.production \
  daniu:latest
```

`.env.production` 至少需要设置：

```bash
NODE_ENV=production
DANIU_STORAGE_DIR=/data/daniu
DANIU_ADMIN_ACCOUNT=admin@your-company.local
DANIU_ADMIN_PASSWORD=<change-me>
DANIU_SESSION_SECRET=<32+ random chars>
DEEPSEEK_API_KEY=<secret>
DEEPSEEK_MODEL=deepseek-v4-pro
DANIU_LOCAL_LLM_BASE_URL=http://your-local-model/v1
DANIU_LOCAL_LLM_API_KEY=<secret>
DANIU_LOCAL_LLM_MODEL=qwen2.5-32b-deepconf
DANIU_AUTO_PROVIDER_ORDER=deepseek,minimax,local
DANIU_ENABLE_DEMO_DATA=false
```

健康检查：

```bash
curl http://localhost:3000/api/health
```

`/api/health` 返回 `503 degraded` 时，通常是生产密钥、管理员密码或模型供应商未配置。

## 存储结构

默认存储在 `.daniu/`，Docker 中默认存储在 `/data/daniu/`。

```text
storage/
  uploads/            # 原始上传文件
  knowledge.json      # 资料清单
  chunks.json         # 本地检索片段
  skills.json         # GitHub Skill 导入后的大牛视角
  audit/YYYY-MM-DD.jsonl
```

当前版本使用本地 JSON 文件作为设备内置存储，适合单机部署。后续如果要支持多节点、高并发或企业统一账号，应迁移到数据库、对象存储和统一身份系统。

## 验证

```bash
npm run lint
npm run build
```
