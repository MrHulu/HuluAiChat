# HuluChat 用户行为埋点方案设计

> 版本: v1.0
> 创建时间: 2026-03-07 (Cycle #140)
> 状态: 待 Boss 确认

## 1. 背景与目标

### 问题
- MAU ~100（目标 50,000）
- 5 天发布 5 个版本，但增长数据不明确
- 缺乏用户行为数据来指导产品决策

### 目标
1. 收集用户行为数据，为未来功能决策提供依据
2. 了解用户使用模式（功能使用率、留存率）
3. 量化产品改进效果

## 2. 技术方案

### 2.1 架构设计

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React 前端     │───▶│   FastAPI 后端   │───▶│   本地数据库     │
│  useAnalytics   │    │  /api/analytics │    │  analytics 表   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**设计原则**：
- 本地优先：数据存储在用户本地（隐私友好）
- 轻量上报：批量上报，减少网络请求
- 可关闭：用户可以选择退出

### 2.2 数据模型

```sql
-- 分析事件表
CREATE TABLE analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,        -- 事件名称
    event_category TEXT NOT NULL,    -- 事件分类
    event_properties TEXT,           -- JSON 格式的属性
    session_id TEXT,                 -- 会话 ID（如果相关）
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_at DATETIME                 -- 上报时间（NULL 表示未上报）
);

-- 聚合统计表（用于本地展示）
CREATE TABLE analytics_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name TEXT NOT NULL UNIQUE,
    metric_value INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 3. 埋点事件清单

### 3.1 核心事件

| 事件名称 | 分类 | 触发时机 | 属性 |
|---------|------|---------|------|
| `app_start` | lifecycle | 应用启动 | version, platform |
| `app_close` | lifecycle | 应用关闭 | session_duration |
| `session_created` | session | 创建新会话 | folder_id |
| `session_deleted` | session | 删除会话 | message_count |
| `message_sent` | chat | 发送消息 | model, has_image, rag_enabled |
| `message_edited` | chat | 编辑消息 | - |
| `model_switched` | settings | 切换模型 | from_model, to_model |
| `settings_changed` | settings | 修改设置 | setting_key |
| `folder_created` | organization | 创建文件夹 | - |
| `export_used` | utility | 导出会话 | format |
| `search_performed` | utility | 搜索内容 | result_count |
| `plugin_installed` | plugins | 安装插件 | plugin_id |
| `rag_document_uploaded` | rag | 上传 RAG 文档 | file_type, file_size |

### 3.2 关键指标（KPIs）

| 指标名称 | 计算方式 | 目标 |
|---------|---------|------|
| DAU | 每日 `app_start` 去重用户数 | - |
| 消息数/会话 | `message_sent` / `session_created` | > 5 |
| RAG 使用率 | `rag_document_uploaded` 用户数 / DAU | > 20% |
| 功能发现率 | 各 feature 使用用户 / DAU | - |
| 留存率 | D+1, D+7, D+30 回访率 | - |

## 4. 实现方案

### 4.1 后端 API

```python
# backend/api/analytics.py
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

router = APIRouter()

class AnalyticsEvent(BaseModel):
    event_name: str
    event_category: str
    event_properties: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None

class BatchEvents(BaseModel):
    events: List[AnalyticsEvent]

@router.post("/events")
async def track_event(event: AnalyticsEvent):
    """记录单个事件"""
    pass

@router.post("/events/batch")
async def track_events(batch: BatchEvents):
    """批量记录事件（推荐）"""
    pass

@router.get("/metrics")
async def get_metrics():
    """获取本地统计指标"""
    pass

@router.delete("/data")
async def clear_analytics_data():
    """清除所有分析数据（用户隐私）"""
    pass
```

### 4.2 前端 Hook

```typescript
// src/hooks/useAnalytics.ts
import { useCallback } from 'react';

interface AnalyticsEvent {
  eventName: string;
  eventCategory: string;
  eventProperties?: Record<string, unknown>;
  sessionId?: string;
}

export function useAnalytics() {
  const track = useCallback(async (event: AnalyticsEvent) => {
    try {
      await fetch('http://127.0.0.1:8765/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      // 静默失败，不影响用户体验
      console.debug('Analytics track failed:', error);
    }
  }, []);

  const trackBatch = useCallback(async (events: AnalyticsEvent[]) => {
    // 批量上报逻辑
  }, []);

  return { track, trackBatch };
}
```

## 5. 实施计划

### Phase 1: 基础设施（1-2 天）
- [ ] 创建数据库表和模型
- [ ] 实现后端 API
- [ ] 创建前端 Hook
- [ ] 单元测试

### Phase 2: 核心埋点（1 天）
- [ ] 应用生命周期事件
- [ ] 会话和消息事件
- [ ] 模型切换事件

### Phase 3: 扩展埋点（1 天）
- [ ] RAG 使用事件
- [ ] 插件使用事件
- [ ] 搜索和导出事件

### Phase 4: 数据展示（可选）
- [ ] 本地统计仪表板
- [ ] 导出数据功能

## 6. 隐私考虑

1. **本地存储**：数据存储在用户本地，不上传到云端
2. **用户控制**：设置中提供"关闭分析"选项
3. **数据脱敏**：不收集消息内容，只收集行为元数据
4. **数据清理**：提供一键清除分析数据功能

## 7. 待确认事项

请 Boss 确认以下问题：

1. **数据上报**：是否需要将数据上报到云端服务器？
   - [ ] 是，需要搭建后端服务
   - [ ] 否，仅本地存储

2. **隐私政策**：是否需要更新隐私政策？
   - [ ] 需要更新
   - [ ] 仅本地数据不需要

3. **用户同意**：是否需要在首次启动时获取用户同意？
   - [ ] 需要（弹窗确认）
   - [ ] 不需要（默认开启，可关闭）

4. **实施优先级**：
   - [ ] 立即实施（v3.50.0）
   - [ ] 下一版本实施
   - [ ] 暂缓，先解决其他问题

---

**下一步**：收到确认后，立即开始 Phase 1 开发。
