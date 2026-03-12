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
  subject: '[HuluChat] v3.57.0 完成 - 所有任务已完成',
  text: `Hi Boss,

v3.57.0 版本已完成！

## 完成状态
- 版本：v3.57.0
- 主题：对话控制增强 + 工作流效率
- MVP 功能：5 个 ✅ 全部完成

## Phase 1 (P0) - 核心对话增强
- ✅ TASK-195: 消息重新生成
- ✅ TASK-196: 消息编辑
- ✅ TASK-197: 会话模板

## Phase 2 (P1) - 效率工具
- ✅ TASK-198: 自定义命令
- ✅ TASK-199: 批量会话操作

## 阻塞任务（需要您操作）
1. TASK-163: sidecar 健康监控
   - 原因：Rust 编译内存不足
   - 建议：增加 CI 内存或本地编译

2. TASK-164: 更新签名验证
   - 状态：代码已完成
   - 需要：配置 GitHub Secrets

3. TASK-116: Product Hunt 素材
   - 需要：您准备截图和视频

## 等待决策：下一步方向

选项：
A. 规划下一个版本（v3.58.0）
B. 发布 v3.57.0 到生产
C. 执行 Product Hunt 准备
D. 其他指示

📧 若 5 分钟内未收到回复，将自动执行选项 A（规划 v3.58.0）

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
