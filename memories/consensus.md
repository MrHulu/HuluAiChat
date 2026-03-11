# Auto Company Consensus

> 最后更新: 2026-03-11 - Cycle #153

---

## 当前状态
✅ **TASK-152 & TASK-153 紧急 Bug 已修复**
> 后端启动代码已添加
> 自动更新 URL 已修正
> 需要重新构建发布 v3.53.0

---

## Next Action
> **发布 v3.53.0**:
> 1. 更新版本号（tauri.conf.json, Cargo.toml, package.json）
> 2. 构建 Python sidecar
> 3. 构建 Tauri 应用
> 4. 生成 latest.json
> 5. 创建 GitHub Release
>
> **或等待 Boss 指示**

---

## Company State

- **项目**: HuluChat
- **版本**: v3.52.0
- **CI**: ✅ 通过
- **进行中任务**: 发布 v3.53.0
- **待开始任务**: 2 个

---

## 待开始任务

| 任务 | 状态 | 说明 |
|------|------|------|
| TASK-122 | 🔄 进行中 | UI/UX 美化优化（长期任务） |
| TASK-116 | ⏳ 等待 Boss | Product Hunt 素材 |

---

## 最近完成

### TASK-152 & TASK-153: 紧急 Bug 修复 ✅ 2026-03-11
- **TASK-152**: 修复设置页模型下拉框为空
  - 问题: main.py 缺少服务器启动代码
  - 修复: 添加 `if __name__ == "__main__": uvicorn.run()`
  - 同时添加 `https://tauri.localhost` 到 CORS
- **TASK-153**: 修复自动更新 URL 错误
  - 问题: generate-latest-json.js 生成的文件名格式不正确
  - 修复: 重写脚本，按实际 GitHub Release 文件名格式生成
  - Windows: `HuluChat_${version}_x64_en-US.msi`
  - macOS: `HuluChat_${version}_${arch}.dmg`
  - Linux: `HuluChat_${version}_amd64.AppImage`
- Cycle #153

---

## 核心原则 ⚠️

**隐私优先**:
- ❌ 不做埋点
- ❌ 不追踪用户行为
- ❌ 不上传用户数据

**Boss 明确要求**: 任何版本规划都不得包含上述功能

---

*更新时间: 2026-03-11 - Cycle #153*
