# 任务清单

## 🔴 紧急任务（阻塞 Boss 工作）
- 无

## 待开始
<!-- 新任务添加到这里 -->
- [ ] **TASK-122**: 🎨 UI/UX 美化优化（持续进行）
  - 状态：长期任务，持续进行
  - 方向：界面美化、交互优化、视觉一致性

- [ ] **TASK-116**: 🎬 准备 Product Hunt 发布素材(截图、视频) - 等待 Boss

## 已完成（最近）
- [x] **TASK-156**: 🔧 修复 GitHub Release Workflow URL 错误 + 发布 v3.54.0 ✅ 2026-03-12
  - 修复 `.github/workflows/release.yml` 中的 GitHub URL
  - `MrHulu/HuluChat` → `MrHulu/HuluAiChat`
  - 发布 v3.54.0
  - Cycle #156

- [x] **TASK-155**: ✨ 添加消息删除功能 ✅ 2026-03-11
  - 后端: DELETE /{session_id}/messages/{message_id} 端点
  - 前端: API 客户端、useChat hook、MessageItem 组件
  - i18n: EN/ZH 翻译
  - Cycle #155

- [x] **TASK-152**: 🐛 设置页模型下拉框为空 ✅ 2026-03-11
  - 问题: main.py 缺少服务器启动代码
  - 修复: 添加 `if __name__ == "__main__": uvicorn.run()` 启动服务器
  - 同时添加 `https://tauri.localhost` 到 CORS 允许列表
  - Cycle #153

- [x] **TASK-153**: 🐛 自动更新功能 URL 错误 ✅ 2026-03-11
  - 问题: `generate-latest-json.js` 生成的文件名格式不正确
  - 修复: 重写脚本，按实际 GitHub Release 文件名格式生成
  - Windows: `HuluChat_${version}_x64_en-US.msi`
  - macOS: `HuluChat_${version}_${arch}.dmg`
  - Linux: `HuluChat_${version}_amd64.AppImage`
  - Cycle #153

## 已取消
- [x] ~~**TASK-127**: 🎤 用户访谈招募~~ ❌ **Boss 决定取消** - 暂停并删除相关内容
- [x] ~~**TASK-120**: 📊 添加用户行为埋点~~ ❌ **Boss 决定取消** - 隐私优先原则

## ⚠️ 永久禁止事项（Boss 明确要求）
- ❌ **禁止功能**：用户行为埋点、数据追踪、遥测功能、使用统计
- 📋 **原则**：隐私优先（Privacy-First），用户数据不上传、不收集
- 🚫 **执行**：任何版本规划或开发都不得包含上述功能
- 📄 **文档**：CLAUDE.md 和 PROMPT.md 已明确记录此要求

---

*添加任务：秘书/Boss 在"待开始"添加新任务*
