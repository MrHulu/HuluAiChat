# API 配置指南

本文档详细说明如何获取和配置各种 AI 服务的 API Key。

---

## 📋 目录

- [OpenAI 官方](#openai-官方)
- [DeepSeek](#deepseek)
- [Claude (Anthropic)](#claude-anthropic)
- [Google Gemini](#google-gemini)
- [Azure OpenAI](#azure-openai)
- [其他兼容服务](#其他兼容服务)
- [本地部署模型](#本地部署模型)
- [API 安全建议](#api-安全建议)

---

## OpenAI 官方

### 获取 API Key

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 登录你的 OpenAI 账号
3. 进入 [API Keys 页面](https://platform.openai.com/api-keys)
4. 点击 **"Create new secret key"**
5. 复制生成的 Key（格式：`sk-proj-xxxxxxxxxxxx`）

### 配置参数

```
名称: OpenAI (或任意名称)
Base URL: https://api.openai.com/v1
API Key: sk-proj-xxxxxxxxxxxx (你复制的 Key)
Model ID: gpt-4o (或 gpt-4o-mini, gpt-4-turbo 等)
```

### 可用模型

| Model ID | 说明 |
|----------|------|
| `gpt-4o` | 最新旗舰模型，多模态 |
| `gpt-4o-mini` | 轻量级，速度快 |
| `gpt-4-turbo` | GPT-4 Turbo |
| `o1-preview` | 推理增强模型 |
| `o1-mini` | 轻量级推理模型 |

### 充值与定价

- 访问 [Billing 页面](https://platform.openai.com/account/billing)
- 最低充值 $5
- 按 token 使用量计费

---

## DeepSeek

### 获取 API Key

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/)
2. 注册并登录账号
3. 进入 [API Keys 页面](https://platform.deepseek.com/api_keys)
4. 点击 **"创建 API Key"**
5. 复制生成的 Key

### 配置参数

```
名称: DeepSeek
Base URL: https://api.deepseek.com/v1
API Key: sk-xxxxxxxxxxxx
Model ID: deepseek-chat (或 deepseek-coder)
```

### 可用模型

| Model ID | 说明 |
|----------|------|
| `deepseek-chat` | 通用对话模型 |
| `deepseek-coder` | 代码专用模型 |

### 定价优势

- DeepSeek 价格远低于 OpenAI
- 适合大量使用场景

---

## Claude (Anthropic)

通过 OpenAI 兼容中转服务使用 Claude。

### 配置参数

```
名称: Claude
Base URL: <中转服务地址>/v1
API Key: <中转服务提供的 Key>
Model ID: claude-sonnet-4-20250514 (或其他)
```

### 可用模型（通过中转）

| Model ID | 说明 |
|----------|------|
| `claude-sonnet-4-20250514` | Claude Sonnet 4 |
| `claude-3-5-sonnet-20241022` | Claude 3.5 Sonnet |
| `claude-3-5-haiku-20241022` | Claude 3.5 Haiku |

---

## Google Gemini

通过 OpenAI 兼容接口使用 Gemini。

### 配置参数

```
名称: Gemini
Base URL: https://generativelanguage.googleapis.com/v1beta/openai
API Key: <你的 Google AI API Key>
Model ID: gemini-2.0-flash (或 gemini-1.5-pro)
```

### 获取 API Key

1. 访问 [Google AI Studio](https://aistudio.google.com/)
2. 点击 **"Get API Key"**
3. 复制生成的 Key

---

## Azure OpenAI

### 获取 API Key

1. 登录 [Azure Portal](https://portal.azure.com/)
2. 创建或找到你的 Azure OpenAI 资源
3. 在资源页面左侧选择 **"Keys and Endpoint"**
4. 复制 **API Key** 和 **Endpoint**

### 配置参数

```
名称: Azure OpenAI
Base URL: https://<你的资源名>.openai.azure.com/openai/deployments/<部署名>
API Key: <你的 API Key>
Model ID: <通常留空或在 Base URL 中指定>
```

**注意**: Azure OpenAI 的 Base URL 格式较为特殊，需要包含部署名称。

---

## 其他兼容服务

### OpenAI 中转服务

很多第三方提供 OpenAI API 的中转服务，通常特点是：
- 国内访问更稳定
- 价格可能更优惠
- 支持更多模型

配置方式：
```
Base URL: <中转服务提供的地址>
API Key: <中转服务提供的 Key>
Model ID: <按照服务商说明填写>
```

---

## 本地部署模型

### Ollama

如果你使用 Ollama 本地部署模型：

1. 安装 Ollama 并下载模型：`ollama pull llama3`
2. 启动服务：`ollama serve`
3. 配置：

```
名称: Local Ollama
Base URL: http://localhost:11434/v1
API Key: ollama (可随意填写)
Model ID: llama3 (或你下载的模型名)
```

### LM Studio

1. 下载并安装 [LM Studio](https://lmstudio.ai/)
2. 加载模型并启动本地服务器
3. 配置：

```
名称: LM Studio
Base URL: http://localhost:1234/v1
API Key: lm-studio (可随意填写)
Model ID: <加载的模型名>
```

---

## API 安全建议

### 🔐 保护你的 API Key

1. **不要分享**: API Key 等同于密码，不要告诉他人
2. **定期更换**: 如果怀疑泄露，立即重新生成
3. **设置限额**: 在平台设置中设置月度消费限额
4. **监控使用**: 定期检查 API 使用量，发现异常及时处理

### 💰 避免意外扣费

1. **设置预算预警**: 在 API 平台设置消费提醒
2. **先测试后大量使用**: 先用小模型测试，确认功能正常
3. **选择合适模型**: 简单任务用 mini 或小型模型

### 📊 使用量监控

| 平台 | 监控页面 |
|------|----------|
| OpenAI | https://platform.openai.com/usage |
| DeepSeek | https://platform.deepseek.com/usage |
| Google | https://aistudio.google.com/app/apikey |
| Azure | Azure Portal → Metrics |

---

## 🔍 配置验证

配置完成后，如何验证是否可用？

### 方法 1：发送测试消息

在 HuluChat 中发送简单消息：
```
你好，请回复"配置成功"
```

### 方法 2：快速切换模型

点击顶部模型选择器，确认你的模型出现在列表中。

---

## 🆘 仍然无法配置？

### 检查清单

- [ ] API Key 已完整复制（没有多余空格）
- [ ] Base URL 以 `/v1` 结尾（大多数情况）
- [ ] Model ID 拼写正确
- [ ] 网络连接正常
- [ ] 账户有足够余额
- [ ] 防火墙/代理设置正确

### 获取帮助

- 📖 查看 [用户指南](USER_GUIDE.md)
- 🐛 [报告问题](https://github.com/MrHulu/HuluAiChat/issues)

---

<p align="center">
  <sub>🔑 安全使用 API，享受 AI 对话！</sub>
</p>
