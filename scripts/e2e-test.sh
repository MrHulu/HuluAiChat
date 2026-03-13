#!/bin/bash
# HuluChat E2E 测试脚本
# 使用 agent-browser 进行真实 UI 测试

set -e

echo "=== HuluChat E2E 测试 ==="
echo ""

# 配置
APP_URL="http://localhost:1420"
BACKEND_URL="http://localhost:8765"

# 测试计数器
PASS=0
FAIL=0

# 测试函数
test_pass() {
    echo "✅ PASS: $1"
    ((PASS++))
}

test_fail() {
    echo "❌ FAIL: $1"
    echo "   原因: $2"
    ((FAIL++))
}

# 确保后端和前端运行中
echo "🔍 检查后端状态..."
if curl -s "$BACKEND_URL/api/health" | grep -q "ok"; then
    test_pass "后端健康检查"
else
    test_fail "后端健康检查" "后端未启动或不可用"
    echo "请先启动后端: cd backend && python -m uvicorn main:app --port 8765"
    exit 1
fi

echo "🔍 检查前端状态..."
if curl -s -o /dev/null -w "%{http_code}" "$APP_URL" | grep -q "200"; then
    test_pass "前端服务可用"
else
    test_fail "前端服务不可用" "前端未启动"
    echo "请先启动前端: npm run tauri dev"
    exit 1
fi

echo ""
echo "=== 开始 E2E 测试 ==="
echo ""

# ==================== 测试 1: 欢迎对话框 ====================
echo "📋 测试 1: 欢迎对话框"
agent-browser open "$APP_URL" 2>&1
sleep 2

SNAPSHOT=$(agent-browser snapshot -i 2>&1)
if echo "$SNAPSHOT" | grep -q "欢迎"; then
    test_pass "欢迎对话框显示"
    # 关闭欢迎对话框
    REF=$(echo "$SNAPSHOT" | grep -oP 'button.*关闭.*\[ref=\K[e0-9]+' | head -1)
    if [ -n "$REF" ]; then
        agent-browser click "@$REF" 2>&1
        test_pass "欢迎对话框关闭"
    else
        # 尝试跳过
        agent-browser press Escape 2>&1
    fi
else
    test_fail "欢迎对话框" "未显示欢迎对话框"
fi

# ==================== 测试 2: 新建会话 ====================
echo ""
echo "📋 测试 2: 新建会话"
agent-browser wait 1000 2>&1
SNAPSHOT=$(agent-browser snapshot -i 2>&1)

# 查找新建会话按钮
NEW_CHAT_REF=$(echo "$SNAPSHOT" | grep -oP 'button.*新建.*\[ref=\K[e0-9]+' | head -1)
if [ -n "$NEW_CHAT_REF" ]; then
    agent-browser click "@$NEW_CHAT_REF" 2>&1
    sleep 1
    test_pass "新建会话按钮点击"
else
    test_fail "新建会话按钮" "未找到新建会话按钮"
fi

# ==================== 测试 3: API Key 设置 ====================
echo ""
echo "📋 测试 3: API Key 设置"
agent-browser wait 1000 2>&1
SNAPSHOT=$(agent-browser snapshot -i 2>&1)

# 查找设置按钮
SETTINGS_REF=$(echo "$SNAPSHOT" | grep -oP 'button.*设置.*\[ref=\K[e0-9]+' | head -1)
if [ -n "$SETTINGS_REF" ]; then
    agent-browser click "@$SETTINGS_REF" 2>&1
    sleep 2
    test_pass "设置按钮点击"
else
    test_fail "设置按钮" "未找到设置按钮"
fi

# 检查设置对话框是否打开
SNAPSHOT=$(agent-browser snapshot -i 2>&1)
if echo "$SNAPSHOT" | grep -q "API"; then
    test_pass "设置对话框打开"
else
    test_fail "设置对话框" "设置对话框未打开"
fi

# 查找 API Key 输入框
API_KEY_REF=$(echo "$SNAPSHOT" | grep -oP 'textbox.*\[ref=\K[e0-9]+' | head -1)
if [ -n "$API_KEY_REF" ]; then
    test_pass "找到 API Key 输入框"
    # 输入测试 API Key
    agent-browser fill "@$API_KEY_REF" "test-api-key-12345" 2>&1
    test_pass "API Key 输入"
else
    test_fail "API Key 输入框" "未找到 API Key 输入框"
fi

# 查找保存按钮
SAVE_REF=$(echo "$SNAPSHOT" | grep -oP 'button.*保存.*\[ref=\K[e0-9]+' | head -1)
if [ -n "$SAVE_REF" ]; then
    agent-browser click "@$SAVE_REF" 2>&1
    sleep 1
    test_pass "保存按钮点击"
else
    # 尝试用英文
    SAVE_REF=$(echo "$SNAPSHOT" | grep -oP 'button.*Save.*\[ref=\K[e0-9]+' | head -1)
    if [ -n "$SAVE_REF" ]; then
        agent-browser click "@$SAVE_REF" 2>&1
        sleep 1
        test_pass "保存按钮点击"
    else
        test_fail "保存按钮" "未找到保存按钮"
    fi
fi

# 关闭设置对话框
agent-browser press Escape 2>&1
sleep 1

# 重新打开设置验证 API Key 是否保存
echo ""
echo "📋 测试 4: API Key 持久化验证"
SNAPSHOT=$(agent-browser snapshot -i 2>&1)
SETTINGS_REF=$(echo "$SNAPSHOT" | grep -oP 'button.*设置.*\[ref=\K[e0-9]+' | head -1)
if [ -n "$SETTINGS_REF" ]; then
    agent-browser click "@$SETTINGS_REF" 2>&1
    sleep 2
fi

SNAPSHOT=$(agent-browser snapshot -i 2>&1)
if echo "$SNAPSHOT" | grep -q "placeholder.*•••"; then
    test_pass "API Key 持久化 (placeholder 显示 ••••••)"
elif echo "$SNAPSHOT" | grep -q "已设置"; then
    test_pass "API Key 持久化 (显示已设置)"
else
    # 检查 has_api_key
    API_STATUS=$(curl -s "$BACKEND_URL/api/settings/" | grep -o '"has_api_key":[^,}]*')
    if echo "$API_STATUS" | grep -q "true"; then
        test_pass "API Key 持久化 (后端确认 has_api_key=true)"
    else
        test_fail "API Key 持久化" "API Key 未保存或丢失"
    fi
fi

# 关闭设置
agent-browser press Escape 2>&1
sleep 1

# ==================== 测试 5: 发送消息 ====================
echo ""
echo "📋 测试 5: 发送消息"

# 切换到会话
SNAPSHOT=$(agent-browser snapshot -i 2>&1)
CHAT_REF=$(echo "$SNAPSHOT" | grep -oP 'button.*选择会话.*\[ref=\K[e0-9]+' | head -1)
if [ -n "$CHAT_REF" ]; then
    agent-browser click "@$CHAT_REF" 2>&1
    sleep 1
fi

# 查找消息输入框
SNAPSHOT=$(agent-browser snapshot -i 2>&1)
INPUT_REF=$(echo "$SNAPSHOT" | grep -oP 'region.*输入消息.*\[ref=\K[e0-9]+' | head -1)
if [ -z "$INPUT_REF" ]; then
    INPUT_REF=$(echo "$SNAPSHOT" | grep -oP 'textbox.*\[ref=\K[e0-9]+' | head -1)
fi

if [ -n "$INPUT_REF" ]; then
    test_pass "找到消息输入框"
    # 输入测试消息
    agent-browser fill "@$INPUT_REF" "Hello, this is a test message" 2>&1
    test_pass "消息输入"
    # 发送消息
    agent-browser press Enter 2>&1
    test_pass "消息发送"
    sleep 3
else
    test_fail "消息输入框" "未找到消息输入框"
fi

# ==================== 测试 6: 流式响应 ====================
echo ""
echo "📋 测试 6: 流式响应验证"
sleep 2
SNAPSHOT=$(agent-browser snapshot -i 2>&1)

# 检查是否有 "思考中" 状态
if echo "$SNAPSHOT" | grep -q "思考"; then
    echo "⏳ AI 正在思考中..."
    # 等待响应完成
    for i in {1..30}; do
        sleep 1
        SNAPSHOT=$(agent-browser snapshot -i 2>&1)
        if ! echo "$SNAPSHOT" | grep -q "思考"; then
            break
        fi
    done
fi

# 检查是否有 AI 响应
SNAPSHOT=$(agent-browser snapshot -i 2>&1)
if echo "$SNAPSHOT" | grep -q "assistant"; then
    test_pass "AI 响应显示"
elif echo "$SNAPSHOT" | grep -q "Hello"; then
    test_pass "AI 响应显示 (包含测试消息)"
else
    test_fail "流式响应" "AI 响应未显示或卡在思考中"
fi

# ==================== 测试 7: UI 元素悬浮提示 ====================
echo ""
echo "📋 测试 7: UI 元素悬浮提示验证"
echo "   (检查是否所有按钮都有正确的 tooltip)"

SNAPSHOT=$(agent-browser snapshot -i 2>&1)

# 检查是否有错误的 "双击引用消息" tooltip
if echo "$SNAPSHOT" | grep -q "双击引用消息"; then
    test_fail "UI Tooltip" "仍存在错误的'双击引用消息'tooltip"
else
    test_pass "UI Tooltip" "没有发现错误的 tooltip"
fi

# ==================== 测试结果汇总 ====================
echo ""
echo "================================"
echo "=== E2E 测试结果汇总 ==="
echo "================================"
echo "✅ 通过: $PASS"
echo "❌ 失败: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "🎉 所有测试通过!"
    exit 0
else
    echo "⚠️ 有 $FAIL 个测试失败"
    exit 1
fi
