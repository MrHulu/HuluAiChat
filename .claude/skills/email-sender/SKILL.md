# Email Sender Skill

通用邮件发送 Skill，支持所有项目复用。

## 快速使用

### 方式 1：使用 JSON 文件（推荐）✨

**最可靠的方式**，适合多行内容和脚本调用：

```python
# 1. 创建 JSON 文件
email_content = {
    "to": "boss@qq.com",
    "subject": "邮件主题",
    "body": """Hi Boss,

这是多行内容。

进度：
- Phase 1 ✅
- Phase 2 ⏳

---
AI Assistant"""
}

# 2. 写入 JSON 文件
import json
with open("/tmp/email.json", "w", encoding="utf-8") as f:
    json.dump(email_content, f, ensure_ascii=False, indent=2)

# 3. 发送邮件
python ~/.claude/skills/email-sender/scripts/send_email.py /tmp/email.json
```

### 方式 2：使用命令行（单行内容）

```bash
python ~/.claude/skills/email-sender/scripts/send.py --to "boss@qq.com" --subject "报告" --body "单行内容"
```

### 方式 3：从文件读取

```bash
# 创建邮件内容文件
cat > /tmp/email.txt << EOF
Hi Boss,

多行内容...

---
AI Assistant
EOF

# 发送
python ~/.claude/skills/email-sender/scripts/send.py --to "boss@qq.com" --file /tmp/email.txt
```

---

## 环境变量配置

在 `ai-center/.claude/.env` 中配置：

```bash
# 必填
EMAIL_SMTP_SERVER=smtp.qq.com
EMAIL_SMTP_PORT=465
EMAIL_USERNAME=your-email@qq.com
EMAIL_PASSWORD=your-app-password    # 授权码，不是登录密码

# 可选
EMAIL_FROM_NAME=AI Assistant
EMAIL_TO_DEFAULT=boss@company.com
EMAIL_USE_SSL=true
```

### 常见 SMTP 配置

| 服务商 | Server | Port | 说明 |
|--------|--------|------|------|
| QQ邮箱 | smtp.qq.com | 465/587 | 需开启 SMTP，使用授权码 |
| 163邮箱 | smtp.163.com | 465 | 需授权码 |
| Gmail | smtp.gmail.com | 587 | 需应用专用密码 |
| 腾讯企业 | smtp.exmail.qq.com | 465 | - |

---

## 在 Python 脚本中使用

### 封装函数

```python
import json
from pathlib import Path

def send_email_to_boss(subject: str, body: str, to: str = None):
    """
    发送邮件给 Boss

    Args:
        subject: 邮件主题
        body: 邮件正文（支持多行）
        to: 收件人（可选，默认使用配置）
    """
    # 默认收件人
    if to is None:
        to = "491849417@qq.com"

    # 创建 JSON 配置
    email_config = {
        "to": to,
        "subject": subject,
        "body": body
    }

    # 写入临时文件
    json_file = Path("/tmp/email_config.json")
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(email_config, f, ensure_ascii=False, indent=2)

    # 调用发送脚本
    import subprocess
    result = subprocess.run(
        ["python", "D:/HuluMan/project/ai-center/.claude/skills/email-sender/scripts/send_email.py", str(json_file)],
        capture_output=True,
        text=True
    )

    # 清理临时文件
    json_file.unlink()

    return result.returncode == 0

# 使用示例
send_email_to_boss(
    subject="进度汇报",
    body="""Hi Boss,

TASK-110 进度更新：
- Phase 1 ✅
- Phase 2 ✅

整体进度：75%

---
AI Assistant"""
)
```

---

## 文件结构

```
email-sender/
├── SKILL.md                    # 本文件
├── scripts/
│   ├── send.py                 # 主发送脚本（命令行）
│   ├── send_email.py           # JSON 封装脚本（推荐）✨
│   ├── config.py               # 配置读取
│   └── test_config.py          # 配置测试
└── templates/
    ├── email_html.html         # HTML 邮件模板
    └── .env.example            # 环境变量模板
```

---

## 故障排查

### 1. 邮件内容不完整（只有第一行）

**问题原因**：命令行参数传递时多行字符串被截断

**解决方案**：使用 **JSON 文件方式**（方式 1）

### 2. 连接失败

```powershell
# 测试网络连通性
Test-NetConnection smtp.qq.com -Port 465
```

### 3. 认证失败

- 确认使用的是**授权码**，不是登录密码
- QQ邮箱需在设置中开启 SMTP 服务

### 4. 防火墙问题

- 公司网络可能封锁 SMTP 端口
- 尝试使用 VPN 或切换网络

---

## 安全建议

1. **永远不要**把密码提交到 Git
2. 使用 `.env` 文件存储敏感信息
3. 定期更换授权码/密码
4. 不同服务使用不同密码

---

## 快速参考

| 方式 | 适用场景 | 可靠性 |
|------|----------|--------|
| **JSON 文件** | 多行内容、脚本调用 | ⭐⭐⭐⭐⭐ |
| 文件读取 | Markdown 文档 | ⭐⭐⭐⭐ |
| 命令行 | 单行内容 | ⭐⭐⭐ |

---

## 更新日志

- **2026-03-07**: 新增 `send_email.py` JSON 方式，解决多行内容截断问题
