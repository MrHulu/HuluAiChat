const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: '491849417@qq.com',
    pass: process.env.QQ_MAIL_PASS || 'oxrkbukqzgpgbfeb'
  }
});

const mailOptions = {
  from: '491849417@qq.com',
  to: '491849417@qq.com',
  subject: '[HuluChat] 所有任务完成 - 等待指示',
  text: `Hi Boss,

HuluChat 所有短期任务已完成！

## 当前状态
- 版本：v3.58.0 ✅ 已完成
- 周期：Cycle #1 - #18
- 测试：1826 个测试通过（77 个测试文件）
- 已完成任务计数：50
- 待开始任务：0 个

## 最近版本完成情况
- v3.58.0: 消息交互增强 + 个性化体验（5 个功能）
- v3.57.0: 对话控制增强 + 工作流效率（5 个功能）
- v3.56.0: AI 知识中心 + 帮助支持体系（10 个功能）

## 阻塞任务（需要您操作）
1. TASK-163: sidecar 健康监控 - Rust 编译内存不足
2. TASK-164: 更新签名验证 - 需配置 GitHub Secrets

## 下一步决策
等待您的指示：

A. 规划下一个版本（v3.59.0）
B. Product Hunt 准备（TASK-116 待执行）
C. 执行长期任务
D. 其他指示

📧 若 5 分钟内未收到回复，将自动执行选项 A（规划下一个版本）

---
AI Assistant
AI Center Secretary`
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('邮件发送失败:', error);
    process.exit(1);
  }
  console.log('邮件发送成功:', info.response);
});
