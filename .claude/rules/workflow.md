# 工作流程详细规则

> 详细的工作流程步骤，供执行任务时参考

---

## Phase 1: 取任务

1. **读取 TASKS.md**
   - 查看"待开始"区域
   - 选择优先级最高的任务

2. **读取 memories/consensus.md**
   - 了解当前项目状态
   - 查看最近的决策和背景

3. **更新 consensus.md Next Action**
   - 记录即将开始的任务

---

## Phase 2: 执行任务

### 技术任务（开发/修复）

1. **分析需求**
   - 阅读相关文档（CLAUDE.md, README, 技术文档）
   - 查看现有代码结构
   - **确认不涉及埋点功能**

2. **TDD 流程**
   ```bash
   # 先写测试
   npm run test:watch -- <test-file>

   # 再写代码
   # 代码会让测试失败

   # 实现功能
   # 测试通过

   # 重构
   # 保持测试通过
   ```

3. **本地验证**
   ```bash
   # 类型检查
   npm run typecheck

   # Lint
   npm run lint

   # 构建
   npm run build

   # 完整测试
   npm test
   ```

4. **提交并推送代码**
   ```bash
   git add .
   git commit -m "feat: 简短描述"
   git push
   ```

### 规划任务（产品/设计）

1. **组建 Agent 团队**
   - 使用 `/team` 指令动态组建团队
   - 不同任务类型需要不同的 Agent 组合

2. **协作决策**
   - 每个 Agent 发挥专业能力
   - CEO 做最终决策
   - **确认不包含埋点功能**

3. **输出文档**
   - 保存到 `docs/` 目录
   - 更新 consensus.md

---

## Phase 3: 完成任务

1. **更新 TASKS.md**
   - 将任务从"待开始"移到"已完成"
   - 记录完成时间

2. **更新 consensus.md**
   - 记录完成情况
   - **任务完成计数 +1**
   - 检查是否达到 10 个任务

3. **检查下一个任务**
   - 查看 TASKS.md 是否还有待开始任务
   - 如果有 → 返回 Phase 1
   - 如果没有 → 进入 Phase 4

---

## Phase 4: 周期性汇总（每 10 个任务完成）

**触发条件**：完成 10 个有意义的开发任务

**任务定义**：
- ✅ 功能开发、Bug 修复、功能规划、文档更新、测试编写
- ❌ 纯样式调整、小修改、提交后撤回

**邮件内容**：
```json
{
  "to": "491849417@qq.com",
  "subject": "[HuluChat] 周期性汇总 - 已完成 {N} 个任务",
  "body": "Hi Boss,\n\n周期 #{last_email_cycle + 1} - #{current_cycle} 汇总：\n\n完成的任务：\n- {列出完成的 10 个任务}\n\n当前状态：\n- 版本：{当前版本}\n- 进行中任务：{进行中的任务}\n- 待开始任务：{待开始的任务}\n\n遇到的问题：\n- {如果有阻塞问题}\n\n下一步：\n- {计划执行的任务}\n\n耗时：{耗时}\n\n---\nAI Assistant"
}
```

---

## Phase 5: 无任务时的处理

**当 TASKS.md 中"待开始"区域为空时**：

1. **检查当前状态**
   - 查看 `memories/consensus.md`
   - 确认所有任务确实已完成
   - 检查是否有未合并的 PR

2. **发邮件给 Boss**
   ```json
   {
     "to": "491849417@qq.com",
     "subject": "[HuluChat] 所有任务完成 - 等待指示",
     "body": "Hi Boss,\n\nHuluChat 所有短期任务已完成，当前状态：\n- 版本：{当前版本}\n- 周期：{当前周期}\n\n等待决策：下一步方向\n\n选项：\nA. 规划下一个版本\nB. Product Hunt 准备\nC. 执行长期任务\n\n📧 若 5 分钟内未收到回复，将自动执行选项 A\n\n---\nAI Assistant"
   }
   ```

3. **等待或自动执行**
   - 如果收到 Boss 回复 → 按照 Boss 指示执行
   - 如果 5 分钟内无回复 → 自动规划下一个版本
