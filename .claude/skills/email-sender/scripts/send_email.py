#!/usr/bin/env python3
"""
邮件发送封装脚本 - 用于 call_skill 调用
解决多行内容传递问题
"""

import sys
import json
from pathlib import Path

# 添加 scripts 目录到路径
scripts_dir = Path(__file__).parent
sys.path.insert(0, str(scripts_dir))

from send import send_email, get_config


def main():
    """
    从 JSON 文件或命令行参数读取邮件内容并发送

    使用方式：
        python send_email.py <json_file>

    JSON 格式：
        {
            "to": "boss@qq.com",
            "subject": "邮件主题",
            "body": "邮件正文\\n\\n支持多行"
        }
    """
    if len(sys.argv) < 2:
        print("用法: python send_email.py <json_file>")
        sys.exit(1)

    json_file = Path(sys.argv[1])

    if not json_file.exists():
        print(f"错误: JSON 文件不存在: {json_file}")
        sys.exit(1)

    # 读取 JSON 配置
    with open(json_file, encoding="utf-8") as f:
        email_config = json.load(f)

    to = email_config.get("to")
    subject = email_config.get("subject", "AI Assistant 通知")
    body = email_config.get("body", "")

    # 调试输出
    print(f"[DEBUG] To: {to}")
    print(f"[DEBUG] Subject: {subject}")
    print(f"[DEBUG] Body length: {len(body)}")
    print(f"[DEBUG] Body preview: {body[:200]}")

    if not to:
        print("错误: JSON 中缺少 'to' 字段")
        sys.exit(1)

    if not body:
        print("错误: JSON 中缺少 'body' 字段")
        sys.exit(1)

    # 加载邮件配置
    config = get_config()

    # 发送邮件
    print("=" * 50)
    print("Email Sender")
    print("=" * 50)
    print(f"收件人: {to}")
    print(f"主题: {subject}")
    print()

    success, result = send_email(
        to=to,
        subject=subject,
        body=body,
        html=False,
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
