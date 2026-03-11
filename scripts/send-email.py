#!/usr/bin/env python3
"""
邮件发送脚本

配置优先级：
1. .claude/settings.json 的 env 字段（优先）
2. 系统环境变量（备选）
"""

import os
import sys
import json
import smtplib
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# 缓存 settings.json 内容
_settings_cache = None


def load_settings() -> dict:
    """加载 settings.json 的 env 字段"""
    global _settings_cache
    if _settings_cache is not None:
        return _settings_cache

    settings_path = Path(__file__).parent.parent / ".claude" / "settings.json"
    if settings_path.exists():
        try:
            with open(settings_path, "r", encoding="utf-8") as f:
                settings = json.load(f)
                _settings_cache = settings.get("env", {})
                return _settings_cache
        except Exception as e:
            print(f"⚠️ 读取 settings.json 失败: {e}")
    _settings_cache = {}
    return _settings_cache


def get_config(key: str, default: str = None) -> str:
    """
    获取配置值

    优先级：
    1. settings.json 的 env 字段
    2. 系统环境变量
    """
    # 1. 先从 settings.json 获取
    settings = load_settings()
    value = settings.get(key)
    if value:
        return value

    # 2. 再从环境变量获取
    return os.environ.get(key, default)


def send_email(subject: str, body: str, to: str = None) -> bool:
    """发送邮件"""

    # 收件人（默认发给自己）
    to = to or get_config("EMAIL_TO") or get_config("EMAIL_TO_DEFAULT", "boss@example.com")

    # 发件人
    sender = get_config("EMAIL_FROM", "noreply@example.com")

    # SMTP 配置（支持多种变量名）
    smtp_host = get_config("SMTP_HOST") or get_config("SMTP_SERVER") or get_config("EMAIL_SMTP_SERVER")
    smtp_port = int(get_config("SMTP_PORT") or get_config("EMAIL_SMTP_PORT", "587"))
    smtp_user = get_config("SMTP_USER") or get_config("SMTP_USERNAME") or get_config("EMAIL_USERNAME")
    smtp_pass = get_config("SMTP_PASSWORD") or get_config("EMAIL_PASSWORD")

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
