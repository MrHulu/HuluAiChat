# Auto Company Consensus

> 最后更新: 2026-03-11 - Cycle #156

---

## 当前状态
🔄 **Boss 指令：修复 GitHub Release Workflow URL 错误 + 发布 v3.54.0**

---

## Next Action
> **立即执行 TASK-156**:
> 1. 修复 `.github/workflows/release.yml` 中的 GitHub URL
> 2. 提交并推送修复
> 3. 更新版本号到 v3.54.0
> 4. 创建 tag 并发布
> 5. 验证 latest.json URL 正确

---

## 任务详情

### TASK-156: 🔧 修复 GitHub Release Workflow URL 错误 + 发布 v3.54.0

**问题描述**:
- `.github/workflows/release.yml` 中 `latest.json` 的 GitHub URL 错误
- 错误使用: `MrHulu/HuluChat`
- 正确应为: `MrHulu/HuluAiChat`

**影响**: 自动更新功能无法正确下载新版本

**修复内容**:
```yaml
darwin-x86_64:
  url: "https://github.com/MrHulu/HuluAiChat/releases/download/${TAG_NAME}/HuluChat_${VERSION}_x64.dmg"

darwin-aarch64:
  url: "https://github.com/MrHulu/HuluAiChat/releases/download/${TAG_NAME}/HuluChat_${VERSION}_aarch64.dmg"

linux-x86_64:
  url: "https://github.com/MrHulu/HuluAiChat/releases/download/${TAG_NAME}/HuluChat_${VERSION}_amd64.AppImage"

windows-x86_64:
  url: "https://github.com/MrHulu/HuluAiChat/releases/download/${TAG_NAME}/HuluChat_${VERSION}_x64_en-US.msi"
```

**发布流程**:
1. 修复 workflow 文件
2. 提交: `git add . && git commit -m "fix: correct GitHub repository URL in release workflow"`
3. 更新版本号: v3.53.0 → v3.54.0
4. 推送: `git push`
5. 创建 tag: `git tag v3.54.0 && git push origin v3.54.0`
6. 等待 CI 构建完成
7. 验证 GitHub Release 和 latest.json

---

## Company State

- **项目**: HuluChat
- **当前版本**: v3.53.0
- **目标版本**: v3.54.0
- **进行中任务**: 1 个 (TASK-156)
- **待开始任务**: 2 个 (TASK-122, TASK-116)

---

## 待开始任务

| 任务 | 状态 | 说明 |
|------|------|------|
| TASK-122 | ⏳ 待开始 | UI/UX 美化优化（长期任务） |
| TASK-116 | ⏳ 等待 Boss | Product Hunt 素材 |

---

## 核心原则 ⚠️

**隐私优先**:
- ❌ 不做埋点
- ❌ 不追踪用户行为
- ❌ 不上传用户数据

**Boss 明确要求**: 任何版本规划都不得包含上述功能

---

*更新时间: 2026-03-11 - Cycle #156*
