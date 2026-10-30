# 开发与发布

## 本地预览与验证

需要 Node.js 20+。没有第三方运行依赖；如果终端没有 npm，预览可以直接运行 `node tools/serve.js`。

```sh
npm run dev
npm test
```

打开 http://localhost:8000。前端使用 ES Modules，请通过 HTTP 服务器访问，直接双击 HTML 不会加载模块。后端数据库测试使用 Node.js 24 自带的 SQLite，建议用 Node.js 24 执行全套测试。

发布前端：GitHub Desktop 选择实际仓库，提交 Changes，再 Push origin。GitHub Pages 会自动发布 main 分支根目录；无需改动 Pages 设置。

## 文件职责

- `questions.js`：场景、题库与各类选项文案池。
- `engine.js`：随机抽题、选择策略、维度分、普通/混合/隐藏人格判定；浏览器与服务端共用。
- `script.js`：页面交互、本机图鉴和统计、可选全站统计队列。
- `storage.js`：本机统计和历史，独立使用 v2 存储，避免沿用初版虚构的人数。更新后本机记录从零开始，不迁移初版的演示计数。
- `backend/`：可选 Cloudflare Worker + D1，独立部署，不由 GitHub Pages 执行。

## 启用真实全站统计

GitHub Pages 只托管静态文件，无法自行收集所有玩家的数据。不配置下列服务时，网页仍可正常玩，只显示明确标注的本机记录。

1. 注册或登录 Cloudflare，在本机终端进入 `backend` 目录，执行：

```sh
npx wrangler login
npx wrangler d1 create research-lab-stats
```

2. 把返回的数据库 ID 填入 `backend/wrangler.toml` 的 `database_id`。`SITE_ORIGIN` 填前端**来源**，当前是 `https://diginto112.github.io`，不要带仓库路径或尾部斜杠。
3. 创建数据库表：

```sh
npx wrangler d1 migrations apply research-lab-stats --remote
```

4. 设置站长口令（使用自己生成的长随机口令，交互输入，不提交到代码）：

```sh
npx wrangler secret put ADMIN_TOKEN
npx wrangler deploy
```

5. 将部署得到的 Worker HTTPS 地址填入根目录 `config.js` 的 `analyticsBaseUrl`，例如 `https://research-lab-stats.你的子域.workers.dev`。提交并推送前端修改。
6. 站长打开 `Worker地址/admin`，输入口令，即可查看页面打开、匿名设备、开始/完成/分享次数、完成率、30 天趋势、人格分布与渠道来源。口令不放在前端，也不在浏览器持久化。

没有任何秘密需要填进 `config.js`。仓库可以保持公开。

## 统计口径

- 页面打开包含刷新；匿名设备标识是随机 UUID，不是指纹，清除本地数据会产生新标识。
- 开始测试每次计一次，未做完也计入完成率分母。完成测试同一 run ID 只计一次。
- 分享次数是系统分享完成或链接复制成功，无法证明接收人已打开。
- 结果页“全站第 N 次解锁该人格”由数据库保存顺序计算，网络失败时明确回退到“本机第 N 次”。是解锁次数，不声称为独立人数。
- 匿名题目 ID 与策略 ID 仅用于服务端校验和重算，数据库只保存人格/分数及事件，完整答案不入库。
- 断网事件暂存在浏览器队列，刷新或恢复网络时重试；后端按事件 ID 和测试 ID 去重。
- 后台按 UTC 日期汇总，本机历史按浏览器当地日期显示。
- 渠道链接：`?from=xiaohongshu`、`?from=wechat`、`?from=github`、`?from=share`，其他值统一记为 direct。
- 公开事件接口具备来源限制、参数校验和去重，仍可被非浏览器客户端模拟，不能作为严格防刷、计费或真实人数凭据。需要时可在 Cloudflare 增加限流规则。

## 隐私与维护

只记录产品统计所需事件，不收集姓名、手机、学校或自由输入；不要在链接中拼接个人资料。当前没有广告/第三方字体依赖。更换计分模型时同步更新 `docs/SCORING.md` 并执行测试。
