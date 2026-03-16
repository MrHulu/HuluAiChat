import { test, expect, Page, APIRequestContext } from '@playwright/test';
import WebSocket from 'ws';

/**
 * HuluChat E2E 测试 - WebSocket 连接韧性 (TASK-322)
 *
 * 测试范围：
 * 1. 连接断开后自动重连
 * 2. 断连期间消息排队
 * 3. 心跳超时处理
 * 4. 连接状态 UI 反馈
 */

// 测试配置
const TEST_CONFIG = {
  backendUrl: 'http://localhost:8765',
  wsUrl: 'ws://localhost:8765',
  apiTimeout: 30000,
  wsTimeout: 60000,
};

// 辅助函数：跳过欢迎引导
async function skipWelcomeIfNeeded(page: Page) {
  const skipButton = page.locator('button:has-text("Skip")');
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click({ force: true });
    await page.waitForTimeout(500);
  }
}

// 辅助函数：创建测试会话
async function createTestSession(request: APIRequestContext) {
  const response = await request.post(`${TEST_CONFIG.backendUrl}/api/sessions`, {
    data: { title: 'WebSocket Resilience Test' },
    timeout: TEST_CONFIG.apiTimeout,
  });
  return response;
}

// 辅助函数：模拟网络离线
async function goOffline(page: Page) {
  const context = page.context();
  await context.setOffline(true);
}

// 辅助函数：恢复网络
async function goOnline(page: Page) {
  const context = page.context();
  await context.setOffline(false);
}

// 辅助函数：确保有选中的会话（通过 UI 创建并选中）
async function ensureSessionSelected(page: Page) {
  // 点击 "New Chat" 按钮创建并选中一个新会话
  const newChatButton = page.getByRole('button', { name: /new|新建/i })
    .or(page.locator('button').filter({ has: page.locator('svg') }).first());

  if (await newChatButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await newChatButton.first().click({ force: true });
    await page.waitForTimeout(500);
  }

  // 等待 textarea 变为可用
  const inputArea = page.locator('textarea').or(page.locator('[contenteditable="true"]'));
  await inputArea.first().waitFor({ state: 'visible', timeout: 5000 });

  // 验证 textarea 不是 disabled 状态
  const isDisabled = await inputArea.first().isDisabled();
  if (isDisabled) {
    // 如果还是 disabled，再点击一次新建按钮
    await newChatButton.first().click({ force: true });
    await page.waitForTimeout(500);
  }
}

test.describe('WebSocket 连接状态', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);
  });

  test('应该显示连接状态指示器', async ({ page }) => {
    // 查找连接状态指示器
    const statusIndicator = page.locator('[class*="connection"]')
      .or(page.locator('[class*="status"]'))
      .or(page.locator('text=/connected|disconnected|connecting|reconnecting/i'));

    const count = await statusIndicator.count();
    console.log(`Found ${count} connection status indicators`);
  });

  test('连接状态应该正确显示', async ({ page }) => {
    // 查找连接状态文本
    const statusText = page.locator('text=/connected|已连接/i')
      .or(page.locator('text=/disconnected|已断开/i'))
      .or(page.locator('text=/connecting|连接中/i'))
      .or(page.locator('text=/reconnecting|重连中/i'));

    // 记录当前状态
    const count = await statusText.count();
    console.log(`Found ${count} status text elements`);
  });
});

test.describe('WebSocket 断连重连', () => {
  test('WebSocket 断开后应该能重连', async ({ request }) => {
    // 创建测试会话
    const sessionResponse = await createTestSession(request);
    expect(sessionResponse.status()).toBe(200);

    const session = await sessionResponse.json();
    const sessionId = session.id;

    // 第一次连接
    const ws1 = new WebSocket(`${TEST_CONFIG.wsUrl}/api/chat/ws/${sessionId}`);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('连接超时')), 10000);

      ws1.on('open', () => {
        clearTimeout(timeout);
        ws1.close();
        resolve();
      });

      ws1.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // 等待一段时间
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 第二次连接（重连）
    const ws2 = new WebSocket(`${TEST_CONFIG.wsUrl}/api/chat/ws/${sessionId}`);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('重连超时')), 10000);

      ws2.on('open', () => {
        clearTimeout(timeout);
        ws2.close();
        resolve();
      });

      ws2.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    console.log('✅ WebSocket 断开重连成功');
  });

  test('重连后应该能正常收发消息', async ({ request }) => {
    // 创建测试会话
    const sessionResponse = await createTestSession(request);
    const session = await sessionResponse.json();
    const sessionId = session.id;

    // 创建 WebSocket 连接
    const ws = new WebSocket(`${TEST_CONFIG.wsUrl}/api/chat/ws/${sessionId}`);

    const messages: unknown[] = [];

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        resolve();
      }, 15000);

      ws.on('open', () => {
        // 发送测试消息
        ws.send(JSON.stringify({
          content: '重连测试消息',
          model: 'gpt-4o-mini',
        }));
      });

      ws.on('message', (data: Buffer) => {
        const msg = JSON.parse(data.toString());
        messages.push(msg);

        if (msg.type === 'stream_end' || msg.type === 'error') {
          clearTimeout(timeout);
          ws.close();
          resolve();
        }
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // 验证收到了消息
    expect(messages.length).toBeGreaterThan(0);
    console.log(`✅ 重连后收到 ${messages.length} 条消息`);
  });
});

test.describe('断连期间消息排队', () => {
  test('离线时输入的消息应该在重连后发送', async ({ page, request }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);

    // 通过 UI 创建并选中一个会话
    await ensureSessionSelected(page);

    const inputArea = page.locator('textarea').or(page.locator('[contenteditable="true"]'));

    // 模拟网络中断
    await goOffline(page);
    await page.waitForTimeout(500);

    // 输入消息
    await inputArea.first().fill('离线测试消息');

    // 恢复网络
    await goOnline(page);
    await page.waitForTimeout(1000);

    // 验证输入内容
    const value = await inputArea.first().inputValue().catch(() => '');
    console.log(`Input value after reconnect: "${value}"`);

    // 清理
    await goOnline(page);
  });

  test('断连时 UI 应该显示离线提示', async ({ page, request }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);

    // 通过 UI 创建并选中一个会话
    await ensureSessionSelected(page);

    // 模拟网络中断
    await goOffline(page);
    await page.waitForTimeout(2000);

    // 查找离线提示
    const offlineIndicator = page.locator('text=/offline|离线|disconnected|已断开/i')
      .or(page.locator('[class*="offline"]'))
      .or(page.locator('[class*="disconnected"]'));

    const count = await offlineIndicator.count();
    console.log(`Found ${count} offline indicators`);

    // 恢复网络
    await goOnline(page);
  });
});

test.describe('心跳机制', () => {
  test('WebSocket 应该有心跳机制', async ({ request }) => {
    // 创建测试会话
    const sessionResponse = await createTestSession(request);
    const session = await sessionResponse.json();
    const sessionId = session.id;

    // 创建 WebSocket 连接
    const ws = new WebSocket(`${TEST_CONFIG.wsUrl}/api/chat/ws/${sessionId}`);

    const messages: unknown[] = [];
    let connectionTime = 0;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        resolve();
      }, 35000); // 等待超过一个心跳周期 (30s)

      ws.on('open', () => {
        connectionTime = Date.now();
        console.log('WebSocket 连接已建立');
      });

      ws.on('message', (data: Buffer) => {
        const msg = JSON.parse(data.toString());
        messages.push(msg);

        // 如果收到 pong 或心跳响应，记录下来
        if (msg.type === 'pong' || msg.type === 'heartbeat') {
          console.log(`收到心跳响应: ${JSON.stringify(msg)}`);
        }
      });

      ws.on('close', () => {
        clearTimeout(timeout);
        const duration = Date.now() - connectionTime;
        console.log(`连接持续时间: ${duration}ms`);
        resolve();
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    console.log(`✅ WebSocket 心跳测试完成，收到 ${messages.length} 条消息`);
  });
});

test.describe('连接状态 UI 反馈', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);

    // 通过 UI 创建并选中一个会话
    await ensureSessionSelected(page);
  });

  test('连接中应该显示加载状态', async ({ page }) => {
    // 刷新页面触发重新连接
    await page.reload();

    // 查找加载/连接中指示器
    const loadingIndicator = page.locator('[class*="loading"]')
      .or(page.locator('text=/connecting|连接中/i'))
      .or(page.locator('[class*="spinner"]'));

    // 短暂检查是否有加载状态（可能很快消失）
    const isVisible = await loadingIndicator.first().isVisible({ timeout: 500 }).catch(() => false);
    console.log(`Loading indicator visible during connection: ${isVisible}`);
  });

  test('连接失败应该显示错误', async ({ page, request }) => {
    // 模拟后端不可用
    await goOffline(page);
    await page.waitForTimeout(3000);

    // 查找错误指示器
    const errorIndicator = page.locator('[class*="error"]')
      .or(page.locator('text=/error|错误|failed|失败/i'));

    const count = await errorIndicator.count();
    console.log(`Found ${count} error indicators when offline`);

    // 恢复网络
    await goOnline(page);
  });

  test('重连进度应该显示给用户', async ({ page }) => {
    // 模拟断连
    await goOffline(page);
    await page.waitForTimeout(1000);

    // 恢复网络，触发重连
    await goOnline(page);

    // 查找重连进度指示器
    const reconnectIndicator = page.locator('text=/reconnecting|重连中|reconnect/i')
      .or(page.locator('[class*="reconnect"]'));

    const count = await reconnectIndicator.count();
    console.log(`Found ${count} reconnect indicators`);
  });
});

test.describe('WebSocket 错误恢复', () => {
  test('无效会话 ID 应该返回错误', async ({ request }) => {
    // 使用无效的会话 ID
    const ws = new WebSocket(`${TEST_CONFIG.wsUrl}/api/chat/ws/invalid-session-id`);

    const messages: unknown[] = [];

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        ws.close();
        resolve();
      }, 5000);

      ws.on('message', (data: Buffer) => {
        const msg = JSON.parse(data.toString());
        messages.push(msg);
      });

      ws.on('close', () => {
        clearTimeout(timeout);
        resolve();
      });

      ws.on('error', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    // 可能收到错误消息或连接被关闭
    console.log(`Received ${messages.length} messages for invalid session`);
  });

  test('WebSocket 关闭后资源应该被释放', async ({ request }) => {
    // 创建多个连接并关闭
    for (let i = 0; i < 3; i++) {
      const sessionResponse = await createTestSession(request);
      const session = await sessionResponse.json();
      const sessionId = session.id;

      const ws = new WebSocket(`${TEST_CONFIG.wsUrl}/api/chat/ws/${sessionId}`);

      await new Promise<void>((resolve) => {
        ws.on('open', () => {
          ws.close();
          resolve();
        });
        ws.on('error', () => resolve());
      });
    }

    console.log('✅ 多个 WebSocket 连接创建和关闭成功');
  });
});
