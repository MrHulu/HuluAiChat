#!/usr/bin/env python3
"""
邮件发送脚本 - 从环境变量读取 SMTP 配置
环境变量由 .claude/settings.json 的 env 字段自动注入
"""

import os
import sys
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_email(subject: str, body: str, to: str = None) -> bool:
    """发送邮件"""

    # 收件人（默认发给自己）
    to = to or os.environ.get("EMAIL_TO", "boss@example.com")

    # 发件人
    sender = os.environ.get("EMAIL_FROM", "noreply@example.com")

    # SMTP 配置
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASSWORD")

    if smtp_host and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart()
            msg['From'] = sender
            msg['To'] = to
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain', 'utf-8'))

            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(sender, [to], msg.as_string())

            print(f"✅ 邮件已发送至 {to}")
            return True
        except Exception as e:
            print(f"❌ SMTP 发送失败: {e}")
            return False

    # Fallback: 输出 mailto 链接
    import urllib.parse
    mailto_url = f"mailto:{to}?subject={urllib.parse.quote(subject)}&body={urllib.parse.quote(body)}"
    print(f"\n📧 SMTP 未配置，请手动发送：")
    print(f"收件人: {to}")
    print(f"主题: {subject}")
    print(f"\nmailto 链接:\n{mailto_url}")
    return False


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python send-email.py <主题> [内容]")
        print("示例: python send-email.py '进度汇报' '本周完成了...'")
        sys.exit(1)

    subject = sys.argv[1]
    body = sys.argv[2] if len(sys.argv) > 2 else ""

    send_email(subject, body)
