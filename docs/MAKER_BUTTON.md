# Product Hunt Maker 按钮指南

## 什么是 Maker 按钮？

Product Hunt Maker 按钮是一个可以添加到你网站或产品页面的徽章，显示"我们在 Product Hunt 上线了"或"We're on Product Hunt"。

## 获取 Maker 按钮

### 步骤 1: 发布产品后在 Product Hunt 获取

1. 登录 Product Hunt
2. 进入你的产品页面
3. 点击右侧的 "Get the badge" 或访问: https://www.producthunt.com/badge
4. 选择按钮样式（Light/Dark/Color）
5. 复制生成的 HTML 代码

### 步骤 2: 添加到 README.md

```markdown
<!-- Product Hunt Badge -->
<a href="https://www.producthunt.com/posts/huluchat?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-huluchat" target="_blank">
  <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=YOUR_POST_ID&theme=dark" alt="HuluChat - Minimal AI chat desktop app | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" />
</a>
```

> 注意：需要将 `YOUR_POST_ID` 替换为实际的 Product Hunt 帖子 ID

### 步骤 3: 添加到网站

将相同的代码添加到 website 首页的醒目位置。

## 按钮样式选项

| 样式 | 描述 | 适用场景 |
|------|------|----------|
| Light | 白色背景 | 浅色主题网站 |
| Dark | 深色背景 | 深色主题网站 |
| Featured | 带边框 | 突出显示 |

## 使用时机

- **发布前**: 不显示（需要等产品上线）
- **发布日**: 醒目位置显示，吸引投票
- **发布后**: 可以缩小或移到页脚

## GitHub README 示例位置

建议添加在 README 开头，标题下方：

```markdown
# HuluChat

> 一款极简、跨平台的 AI 聊天桌面客户端

<!-- Product Hunt Badge 放在这里 -->
<a href="https://www.producthunt.com/posts/huluchat">
  <img src="..." alt="HuluChat on Product Hunt" />
</a>

[更多内容...]
```

## 注意事项

1. **发布后立即添加** - 上线后尽快添加按钮，最大化曝光
2. **保持简洁** - 按钮不要太大，影响阅读
3. **主题匹配** - 选择与网站主题一致的颜色
4. **链接有效** - 确保链接指向正确的 Product Hunt 页面

## 发布后行动清单

- [ ] 获取 Product Hunt 帖子 ID
- [ ] 生成 Maker 按钮 HTML
- [ ] 添加到 README.md
- [ ] 添加到 website 首页
- [ ] 测试链接有效
