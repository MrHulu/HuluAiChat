# 发布流程规则

> 版本发布和 PR 管理规则

---

## 🚀 发布流程

### 发布前验证清单

发布新版本前，**必须**完成以下验证：

| 步骤 | 命令 | 验证内容 |
|------|------|----------|
| 1 | `cd backend && python main.py` | 后端能正常启动 |
| 2 | `curl http://localhost:8000/settings/models` | API 返回模型列表 |
| 3 | `npm run lint && npm run build` | 前端无错误 |
| 4 | `npm run test` | 所有测试通过 |

### 发布步骤

1. **更新版本号**
   - `tauri.conf.json`
   - `Cargo.toml`
   - `package.json`

2. **提交并推送**
   ```bash
   git add .
   git commit -m "chore: release v${VERSION}"
   git push
   ```

3. **创建 tag 触发 CI**
   ```bash
   git tag v${VERSION}
   git push origin v${VERSION}
   ```

4. **等待 CI 构建完成**（约 12-15 分钟）
   - 4 个平台：Windows, macOS Intel, macOS ARM, Linux

5. **验证 GitHub Release**
   - 确认包含所有文件：
     - `HuluChat_${VERSION}_x64_en-US.msi` (Windows)
     - `HuluChat_${VERSION}_x64.dmg` (macOS Intel)
     - `HuluChat_${VERSION}_aarch64.dmg` (macOS ARM)
     - `HuluChat_${VERSION}_amd64.AppImage` (Linux)
     - `latest.json`

6. **验证 latest.json URL 可访问**
   ```bash
   curl -I https://github.com/MrHulu/HuluAiChat/releases/download/v${VERSION}/latest.json
   ```

### ⚠️ 禁止行为

- ❌ **禁止跳过本地验证直接发布**
- ❌ **禁止只发布部分平台**
- ❌ **禁止在 CI 失败时创建 Release**

---

## 🔀 PR 管理规则

### 创建 PR 后

| 状态 | 操作 |
|------|------|
| CI 通过且可合并 | **立即合并** |
| CI 正在运行 | 等待完成后再决定 |
| PR 不再需要 | **立即关闭并说明原因** |

### 禁止行为

- ❌ **禁止创建 PR 后不管不问**
- ❌ **禁止让 PR 堆积超过 5 个**
- ❌ **禁止创建过时的功能分支 PR**

### 每日检查

```bash
# 查看未合并 PR
gh pr list --state open

# 关闭过时 PR
gh pr close <number> --comment "过时的 PR，已在新版本中包含"
```

### PR 命名规范

- `feat/xxx` - 新功能
- `fix/xxx` - Bug 修复
- `style/xxx` - UI/UX 优化
- `docs/xxx` - 文档更新
- `chore/xxx` - 杂项（依赖更新、配置等）
