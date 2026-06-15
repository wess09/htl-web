# 海特洛人民政府 Web

当然是虚拟的x
## 提交新的文章或功能

欢迎各位提交新的文章或功能 PR就可以了 awa

## 说明

本网站属于虚构项目 不能代表《异环》开发组

素材来源：

《异环》游戏官网

## Cloudflare 评论系统

评论系统完全运行在 Cloudflare 上：Worker 托管 API 和静态资源，D1 存储已通过审核的评论，Workers AI 负责提交前审核。未通过审核的评论会直接丢弃，不写入 D1。

部署前先创建 D1 数据库并把返回的 `database_id` 填入 `wrangler.jsonc`：

```sh
npx wrangler d1 create htl-comments
```

然后执行迁移、构建并部署：

```sh
npm run cf:d1:migrate:remote
npm run cf:deploy
```

本地调试 Cloudflare Worker：

```sh
npm run build
npm run cf:d1:migrate:local
npx wrangler dev
```

本项目使用 MIT 许可证开源
