# 私有服务器部署（Tailscale + systemd）

适用场景：已有 Linux 云服务器，仅供自己的手机和电脑访问；没有自有域名，不希望自行维护 TLS 证书；每台终端在 SocialCoach 设置页配置自己的模型凭证。

## 边界

- 使用 **Tailscale Serve**，不使用 Funnel。Serve 只对同一 Tailnet 内的设备开放；Funnel 会把服务公开到互联网。
- 不需要自有域名或手工管理证书。Tailscale Serve 为 `*.ts.net` 地址终止 HTTPS。
- 应用只监听 `127.0.0.1`；云平台安全组不开放应用端口。
- 强制 BYOK，服务器不保存模型 API key。练习档案仍保存在各设备浏览器中，不在设备间同步。

## 应用运行方式

国内云服务器如果在 Docker 内拉取基础镜像或安装 npm 依赖反复超时，可以在宿主机用 Node 22 + pnpm 构建 Next.js standalone，再由 systemd 运行单进程。详见 [已知陷阱](./80-known-pitfalls.md#国内服务器上-docker-内构建会被网络掐死2026-09-29)。

在 `app/` 中构建：

```bash
pnpm install --frozen-lockfile
pnpm build
rsync -a --delete .next/static/ .next/standalone/.next/static/
rsync -a --delete public/ .next/standalone/public/
```

systemd 服务的核心配置如下，路径可根据机器调整：

```ini
[Unit]
Description=SocialCoach (Next.js standalone)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/socialcoach/app/.next/standalone
EnvironmentFile=/opt/socialcoach/.env.production
ExecStart=/usr/local/bin/node server.js
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now socialcoach.service
```

## 生产环境变量

`/opt/socialcoach/.env.production` 放在构建上下文之外，不进 Git：

```dotenv
NODE_ENV=production
HOSTNAME=127.0.0.1
PORT=9090

LLM_API_KEY=
LLM_REQUIRE_BYOK=true
```

其他模型默认值可以保留，用于终端设置页的初始提示。开启 `LLM_REQUIRE_BYOK=true` 时，`LLM_API_KEY` 必须留空。修改后重启并检查：

```bash
sudo systemctl restart socialcoach.service
curl -fsS http://127.0.0.1:9090/api/health
```

期望返回：

```json
{"serverKey":false,"requireByok":true}
```

## Tailscale Serve

服务器与手机安装 Tailscale，并登录同一账号。Linux 服务器按 [Tailscale 官方安装说明](https://tailscale.com/docs/install/linux) 安装：

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --hostname=socialcoach-private
sudo tailscale serve --bg http://127.0.0.1:9090
sudo tailscale serve status
```

首次执行 [Serve](https://tailscale.com/docs/features/tailscale-serve) 时，Tailscale 会给出一次性网页授权地址，需要由 Tailnet 所有者确认开启 HTTPS。成功后使用命令输出的 `https://<device>.<tailnet>.ts.net/` 访问，不要在文档中写死具体 Tailnet 域名。

验证：

```bash
curl -fsS https://<device>.<tailnet>.ts.net/api/health
sudo ss -lntp | grep ':9090 '
```

第二条必须显示 `127.0.0.1:9090`，不应是 `0.0.0.0:9090`。手机端确认 Tailscale 已连接后，用浏览器打开私有 HTTPS 地址，再将 PWA 添加到主屏幕。

## 网络收口

只有在私有 HTTPS 验证成功后，才执行以下操作：

1. 在云平台安全组中删除应用端口（例如 TCP 9090）的公网入站规则。
2. 确认公网 IP 不再返回页面，Tailnet 地址仍返回 200。
3. 公网 SSH 至少保持“禁用 root、禁用密码、仅公钥登录”。如果之后改用 Tailscale SSH，再关闭公网 22，不要在未验证私网 SSH 前先断开唯一管理通道。

## 更新与回滚

- 更新应用只需重新构建 standalone、复制静态资源并重启 systemd；Tailscale Serve 配置会持续保留，不需要每次重建。
- 修改生产 env 前可以备份，但从“服务器 key”切换到 BYOK 后，必须删除仍包含旧 API key 的备份。
- 停用 Serve：`sudo tailscale serve --https=443 off`。停用前必须先准备其他受控访问通道，不要直接把 `HOSTNAME` 改回 `0.0.0.0`。
