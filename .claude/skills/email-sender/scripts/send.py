#!/usr/bin/env python3
"""
Email Sender Skill - 主发送脚本
支持 Markdown 转 HTML，跨平台使用
"""

import argparse
import smtplib
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from pathlib import Path
from typing import Optional

from config import get_config, print_config_status


def markdown_to_html(markdown: str, title: str = "通知") -> str:
    """简单的 Markdown 转 HTML"""
    import re

    lines = markdown.split("\n")
    html_lines = []

    for line in lines:
        # 标题
        if line.startswith("# "):
            html_lines.append(f"<h1>{line[2:]}</h1>")
        elif line.startswith("## "):
            html_lines.append(f"<h2>{line[3:]}</h2>")
        elif line.startswith("### "):
            html_lines.append(f"<h3>{line[4:]}</h3>")
        # 列表
        elif line.startswith("- ") or line.startswith("* "):
            html_lines.append(f"<li>{line[2:]}</li>")
        elif re.match(r"^\d+\. ", line):
            content = re.sub(r"^\d+\. ", "", line)
            html_lines.append(f"<li>{content}</li>")
        # 分隔线
        elif line.strip() == "---":
            html_lines.append("<hr>")
        # 复选框
        elif "[x]" in line.lower() or "[ ]" in line.lower():
            checked = "[x]" in line.lower()
            content = re.sub(r"\[[x ]\]", "", line, flags=re.IGNORECASE).strip()
            status = "✅" if checked else "⬜"
            html_lines.append(f"<p>{status} {content}</p>")
        # 表格行
        elif "|" in line:
            cells = [c.strip() for c in line.split("|") if c.strip()]
            if cells:
                cell_html = "".join(f"<td>{c}</td>" for c in cells)
                html_lines.append(f"<tr>{cell_html}</tr>")
        # 空行
        elif not line.strip():
            html_lines.append("<br>")
        # 普通段落
        else:
            # 粗体
            line = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", line)
            # 代码
            line = re.sub(r"`(.+?)`", r"<code>\1</code>", line)
            # 链接
            line = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', line)
            html_lines.append(f"<p>{line}</p>")

    html_content = "\n".join(html_lines)

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{
            font-family: 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }}
        h1 {{
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #34495e;
            margin-top: 25px;
        }}
        h3 {{
            color: #7f8c8d;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 15px 0;
        }}
        td, th {{
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }}
        th {{
            background-color: #3498db;
            color: white;
        }}
        tr:nth-child(even) {{
            background-color: #f9f9f9;
        }}
        code {{
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Consolas', monospace;
        }}
        a {{
            color: #3498db;
        }}
        hr {{
            border: none;
            border-top: 1px solid #eee;
            margin: 20px 0;
        }}
        .footer {{
            color: #7f8c8d;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }}
    </style>
</head>
<body>
{html_content}
<div class="footer">
    此邮件由 AI Assistant 自动发送
</div>
</body>
</html>"""


def send_email(
    to: str,
    subject: str,
    body: str,
    html: bool = False,
    config=None,
) -> tuple[bool, str]:
    """
    发送邮件

    Args:
        to: 收件人
        subject: 主题
        body: 正文
        html: 是否为 HTML 格式
        config: 邮件配置

    Returns:
        (success, message)
    """
    if config is None:
        config = get_config()

    # 验证配置
    valid, msg = config.validate()
    if not valid:
        return False, f"配置无效: {msg}"

    try:
        # 创建邮件 - 只用 plain text，不用 multipart
        from email.message import EmailMessage

        msg = EmailMessage()
        msg["From"] = formataddr((config.from_name, config.username))
        msg["To"] = to
        msg["Subject"] = subject

        # 只设置纯文本内容，不使用 multipart
        msg.set_content(body, cte="quoted-printable")

        # 连接服务器
        print(f"正在连接 {config.smtp_server}:{config.smtp_port}...")

        if config.use_ssl and config.smtp_port == 465:
            # SSL 连接
            server = smtplib.SMTP_SSL(config.smtp_server, config.smtp_port)
        else:
            # STARTTLS 连接
            server = smtplib.SMTP(config.smtp_server, config.smtp_port)
            if config.use_ssl:
                server.starttls()

        # 登录
        server.login(config.username, config.password)

        # 发送
        server.send_message(msg)
        server.quit()

        return True, f"邮件已发送至 {to}"

    except smtplib.SMTPAuthenticationError:
        return False, "认证失败：请检查用户名和密码（授权码）"
    except smtplib.SMTPConnectError:
        return False, f"无法连接到 {config.smtp_server}，请检查网络"
    except TimeoutError:
        return False, "连接超时，请检查网络或防火墙设置"
    except Exception as e:
        return False, f"发送失败: {str(e)}"


def main():
    # 先加载 .env 文件
    script_dir = Path(__file__).parent           # scripts/
    skill_dir = script_dir.parent                # email-sender/
    claude_dir = skill_dir.parent                # .claude/
    env_path = claude_dir / ".env"
    if env_path.exists():
        load_env_file(env_path)

    parser = argparse.ArgumentParser(description="Email Sender Skill")
    parser.add_argument("--to", help="收件人邮箱")
    parser.add_argument("--subject", default="AI Assistant 通知", help="邮件主题")
    parser.add_argument("--body", help="邮件正文（单行，使用 \\n 表示换行）")
    parser.add_argument("--file", help="从文件读取正文（推荐用于多行内容）")
    parser.add_argument("--html", action="store_true", help="正文为 HTML 格式")
    parser.add_argument("--test", action="store_true", help="测试模式，验证配置")

    args = parser.parse_args()

    # 加载配置
    config = get_config()

    # 测试模式
    if args.test:
        print("=" * 50)
        print("Email Sender - 配置测试")
        print("=" * 50)
        print()
        print_config_status(config)
        print()
        valid, msg = config.validate()
        if valid:
            print(f"✓ {msg}")
            print()
            print("尝试发送测试邮件...")
            success, result = send_email(
                to=config.to_default or config.username,
                subject="Email Sender Skill - 测试邮件",
                body="这是一封测试邮件，如果您收到此邮件，说明配置正确！",
                config=config,
            )
            if success:
                print(f"✓ {result}")
            else:
                print(f"✗ {result}")
        else:
            print(f"✗ {msg}")
        sys.exit(0 if valid else 1)

    # 验证配置
    valid, msg = config.validate()
    if not valid:
        print(f"错误: {msg}")
        print("请配置环境变量或 .env 文件")
        sys.exit(1)

    # 获取收件人
    to = args.to or config.to_default
    if not to:
        print("错误: 未指定收件人，请使用 --to 参数或配置 EMAIL_TO_DEFAULT")
        sys.exit(1)

    # 获取正文
    if args.file:
        # 从文件读取
        file_path = Path(args.file)
        if not file_path.exists():
            print(f"错误: 文件不存在: {file_path}")
            sys.exit(1)
        body = file_path.read_text(encoding="utf-8")
    elif args.body:
        # 从命令行参数读取（支持 \n 转义）
        body = args.body.replace("\\n", "\n")
    else:
        print("错误: 请使用 --body 或 --file 指定邮件内容")
        print("\n使用方法：")
        print("  单行: python send.py --body '内容'")
        print("  多行: python send.py --body '第一行\\n\\n第二行'")
        print("  文件: python send.py --file email.txt")
        sys.exit(1)

    # 发送
    print("=" * 50)
    print("Email Sender")
    print("=" * 50)
    print(f"收件人: {to}")
    print(f"主题: {args.subject}")
    print()

    success, result = send_email(
        to=to,
        subject=args.subject,
        body=body,
        html=args.html,
        config=config,
    )

    if success:
        print(f"✓ {result}")
        sys.exit(0)
    else:
        print(f"✗ {result}")
        sys.exit(1)


if __name__ == "__main__":
    main()
