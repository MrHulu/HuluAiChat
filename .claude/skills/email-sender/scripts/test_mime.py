#!/usr/bin/env python3
"""测试 MIME 邮件内容"""
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

# 模拟邮件内容
to = "491849417@qq.com"
subject = "测试 - MIME 内容"
body = """Hi Boss,

这是多行内容。

项目 1
项目 2
---
AI Assistant"""

# 创建邮件
msg = MIMEMultipart("alternative")
msg["From"] = formataddr(("AI Assistant", "491849417@qq.com"))
msg["To"] = to
msg["Subject"] = subject

# 添加纯文本版本
text_part = MIMEText(body, "plain", "utf-8")
msg.attach(text_part)

# 打印原始邮件内容
print("=== 邮件原始内容 ===")
print(msg.as_string())
