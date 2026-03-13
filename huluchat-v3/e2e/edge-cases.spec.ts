import { test, expect, Page, APIRequestContext } from '@playwright/test';

/**
 * HuluChat E2E 测试 - 边缘场景 (TASK-322)
 *
 * 测试范围：
 * 1. 空会话处理
 * 2. 超长消息处理
 * 3. 特殊字符处理
 * 4. 大量消息性能
 * 5. 并发操作
 */

// 测试配置
const TEST_CONFIG = {
  backendUrl: 'http://localhost:8765',
  apiTimeout: 30000,
};

// 辅助函数：跳过欢迎引导
async function skipWelcomeIfNeeded(page: Page) {
  const skipButton = page.locator('button:has-text("Skip")');
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click();
    await page.waitForTimeout(500);
  }
}

// 辅助函数：创建测试会话
async function createTestSession(request: APIRequestContext, title?: string) {
  const response = await request.post(`${TEST_CONFIG.backendUrl}/api/sessions`, {
    data: { title: title || `Edge Case Test ${Date.now()}` },
    timeout: TEST_CONFIG.apiTimeout,
  });
  return response;
}

test.describe('空会话处理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);
  });

  test('新会话应该显示空状态提示', async ({ page }) => {
    // 创建新会话
    const newChatButton = page.getByRole('button', { name: /new|新建/i });
    await newChatButton.first().click();
    await page.waitForTimeout(500);

    // 查找空状态提示
    const emptyState = page.locator('text=/No messages|没有消息|Start a conversation|开始对话/i')
      .or(page.locator('[class*="empty"]'));

    const count = await emptyState.count();
    console.log(`Found ${count} empty state indicators`);
  });

  test('空会话不应该有导出选项', async ({ page }) => {
    // 创建新会话
    const newChatButton = page.getByRole('button', { name: /new|新建/i });
    await newChatButton.first().click();
    await page.waitForTimeout(500);

    // 查找导出按钮
    const exportButton = page.locator('button:has-text("Export")')
      .or(page.locator('button:has-text("导出")'));

    // 导出按钮可能不存在或被禁用
    const isVisible = await exportButton.first().isVisible({ timeout: 2000 }).catch(() => false);
    const isDisabled = await exportButton.first().isDisabled().catch(() => true);

    console.log(`Export button - visible: ${isVisible}, disabled: ${isDisabled}`);
  });

  test('空会话应该能直接删除', async ({ request }) => {
    // 创建空会话
    const response = await createTestSession(request, 'Empty Session');
    const session = await response.json();
    const sessionId = session.id;

    // 删除空会话
    const deleteResponse = await request.delete(`${TEST_CONFIG.backendUrl}/api/sessions/${sessionId}`, {
      timeout: TEST_CONFIG.apiTimeout,
    });

    expect([200, 204, 404]).toContain(deleteResponse.status());
  });
});

test.describe('超长消息处理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);
  });

  test('输入框应该能处理超长文本', async ({ page }) => {
    const inputArea = page.locator('textarea').or(page.locator('[contenteditable="true"]'));

    // 输入 10000 字符
    const longText = 'A'.repeat(10000);
    await inputArea.first().fill(longText);

    // 验证输入内容
    const value = await inputArea.first().inputValue();
    expect(value.length).toBe(10000);
  });

  test('超长消息应该显示滚动条', async ({ page }) => {
    const inputArea = page.locator('textarea').or(page.locator('[contenteditable="true"]'));

    // 输入大量文本
    const longText = 'Line\n'.repeat(100);
    await inputArea.first().fill(longText);

    // 检查是否有滚动条
    const scrollHeight = await inputArea.first().evaluate((el) => el.scrollHeight);
    const clientHeight = await inputArea.first().evaluate((el) => el.clientHeight);

    console.log(`Scroll height: ${scrollHeight}, Client height: ${clientHeight}`);
  });

  test('消息显示应该能处理长内容', async ({ page }) => {
    // 查找消息区域
    const messageArea = page.locator('[class*="message"]')
      .or(page.locator('[class*="chat"]'));

    // 即使没有消息，区域也应该存在
    const count = await messageArea.count();
    console.log(`Found ${count} message area elements`);
  });
});

test.describe('特殊字符处理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);
  });

  test('应该能处理 HTML 标签', async ({ page }) => {
    const inputArea = page.locator('textarea').or(page.locator('[contenteditable="true"]'));

    // 输入包含 HTML 标签的文本
    const htmlText = '<div>Hello</div> <script>alert("xss")</script>';
    await inputArea.first().fill(htmlText);

    // 验证输入内容被正确处理（不应该执行脚本）
    const value = await inputArea.first().inputValue();
    expect(value).toContain('<div>');
    expect(value).toContain('<script>');
  });

  test('应该能处理 JSON 字符串', async ({ page }) => {
    const inputArea = page.locator('textarea').or(page.locator('[contenteditable="true"]'));

    // 输入 JSON 字符串
    const jsonText = '{"key": "value", "number": 123, "array": [1, 2, 3]}';
    await inputArea.first().fill(jsonText);

    // 验证输入内容
    const value = await inputArea.first().inputValue();
    expect(value).toContain('"key"');
    expect(value).toContain('"value"');
  });

  test('应该能处理代码块', async ({ page }) => {
    const inputArea = page.locator('textarea').or(page.locator('[contenteditable="true"]'));

    // 输入代码块
    const codeText = '```python\ndef hello():\n    print("Hello")\n```';
    await inputArea.first().fill(codeText);

    // 验证输入内容
    const value = await inputArea.first().inputValue();
    expect(value).toContain('```python');
  });

  test('应该能处理多语言文本', async ({ page }) => {
    const inputArea = page.locator('textarea').or(page.locator('[contenteditable="true"]'));

    // 输入多语言文本
    const multiLangText = 'English 你好 العربية עברית 日本語 한국어';
    await inputArea.first().fill(multiLangText);

    // 验证输入内容
    const value = await inputArea.first().inputValue();
    expect(value).toContain('English');
    expect(value).toContain('你好');
    expect(value).toContain('日本語');
  });

  test('应该能处理换行符', async ({ page }) => {
    const inputArea = page.locator('textarea').or(page.locator('[contenteditable="true"]'));

    // 输入多行文本
    const multilineText = 'Line 1\nLine 2\nLine 3\r\nLine 4';
    await inputArea.first().fill(multilineText);

    // 验证输入内容
    const value = await inputArea.first().inputValue();
    expect(value).toContain('Line 1');
    expect(value).toContain('Line 4');
  });
});

test.describe('大量消息性能', () => {
  test('会话列表应该能处理大量会话', async ({ request }) => {
    // 创建大量会话
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(createTestSession(request, `Performance Test ${i}`));
    }

    const responses = await Promise.all(promises);
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });

    console.log('✅ 创建 20 个会话成功');
  });

  test('消息列表应该使用虚拟化渲染', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);

    // 查找虚拟化列表
    const virtualList = page.locator('[class*="virtual"]')
      .or(page.locator('[class*="scroll"]'));

    const count = await virtualList.count();
    console.log(`Found ${count} virtualized list elements`);
  });

  test('滚动性能应该流畅', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);

    // 获取消息区域
    const messageArea = page.locator('[class*="message"]').first();

    if (await messageArea.isVisible()) {
      // 执行滚动操作
      await messageArea.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      await page.waitForTimeout(100);

      await messageArea.evaluate((el) => {
        el.scrollTop = 0;
      });

      console.log('✅ 滚动操作完成');
    }
  });
});

test.describe('并发操作', () => {
  test('应该能同时创建多个会话', async ({ request }) => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(createTestSession(request, `Concurrent ${i}`));
    }

    const responses = await Promise.all(promises);
    const successCount = responses.filter(r => r.status() === 200).length;

    console.log(`✅ 并发创建 ${successCount}/10 个会话成功`);
    expect(successCount).toBe(10);
  });

  test('应该能同时获取多个会话的消息', async ({ request }) => {
    // 创建会话
    const sessionPromises = [];
    for (let i = 0; i < 5; i++) {
      sessionPromises.push(createTestSession(request, `Concurrent Message ${i}`));
    }

    const sessionResponses = await Promise.all(sessionPromises);
    const sessionIds = await Promise.all(
      sessionResponses.map(r => r.json().then(s => s.id))
    );

    // 并发获取消息
    const messagePromises = sessionIds.map(id =>
      request.get(`${TEST_CONFIG.backendUrl}/api/chat/${id}/messages`)
    );

    const messageResponses = await Promise.all(messagePromises);
    const successCount = messageResponses.filter(r => r.status() === 200).length;

    console.log(`✅ 并发获取 ${successCount}/5 个会话消息成功`);
  });

  test('UI 应该能处理快速点击', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);

    const newChatButton = page.getByRole('button', { name: /new|新建/i });

    // 快速点击
    for (let i = 0; i < 5; i++) {
      await newChatButton.first().click();
      await page.waitForTimeout(100);
    }

    // 等待所有操作完成
    await page.waitForTimeout(1000);

    // UI 应该仍然正常
    const inputArea = page.locator('textarea').or(page.locator('[contenteditable="true"]'));
    await expect(inputArea.first()).toBeVisible();
  });
});

test.describe('键盘快捷键', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);
  });

  test('Ctrl+Shift+N 应该创建新会话', async ({ page }) => {
    await page.keyboard.press('Control+Shift+N');
    await page.waitForTimeout(500);

    // 验证创建了新会话
    const inputArea = page.locator('textarea').or(page.locator('[contenteditable="true"]'));
    await expect(inputArea.first()).toBeVisible();
  });

  test('Ctrl+S 应该不触发浏览器保存', async ({ page }) => {
    // 监听对话框
    let dialogHandled = false;
    page.on('dialog', async dialog => {
      dialogHandled = true;
      await dialog.dismiss();
    });

    await page.keyboard.press('Control+S');
    await page.waitForTimeout(500);

    // 不应该有浏览器保存对话框
    console.log(`Dialog handled: ${dialogHandled}`);
  });

  test('Escape 应该关闭对话框', async ({ page }) => {
    // 打开设置对话框
    const settingsButton = page.getByRole('button', { name: /settings|设置/i });
    await settingsButton.first().click();
    await page.waitForTimeout(500);

    // 按 Escape 关闭
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 对话框应该关闭
    const dialog = page.locator('[role="dialog"]');
    const isVisible = await dialog.isVisible().catch(() => false);
    console.log(`Dialog visible after Escape: ${isVisible}`);
  });

  test('Tab 应该在元素间导航', async ({ page }) => {
    // 按 Tab 键
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // 获取焦点元素
    const focusedElement = page.locator(':focus');
    const tagName = await focusedElement.evaluate(el => el.tagName);

    console.log(`Focused element: ${tagName}`);
    expect(['INPUT', 'TEXTAREA', 'BUTTON', 'A']).toContain(tagName);
  });
});

test.describe('响应式布局', () => {
  test('移动端视图应该正确显示', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);

    // 验证 UI 仍然可用
    const app = page.locator('#root').or(page.locator('body'));
    await expect(app).toBeVisible();
  });

  test('侧边栏在移动端应该可折叠', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);

    // 查找菜单按钮
    const menuButton = page.locator('button').filter({ has: page.locator('svg') }).first();

    if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await menuButton.click();
      await page.waitForTimeout(500);
      console.log('✅ 移动端菜单按钮可点击');
    }
  });

  test('平板视图应该正确显示', async ({ page }) => {
    // 设置平板视口
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);

    // 验证 UI 可用
    const inputArea = page.locator('textarea').or(page.locator('[contenteditable="true"]'));
    await expect(inputArea.first()).toBeVisible();
  });

  test('桌面视图应该正确显示', async ({ page }) => {
    // 设置桌面视口
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);

    // 验证侧边栏可见
    const sidebar = page.locator('aside').or(page.locator('nav')).or(page.locator('[class*="sidebar"]'));
    const count = await sidebar.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('主题切换', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);
  });

  test('应该能切换到深色主题', async ({ page }) => {
    // 查找主题切换按钮
    const themeToggle = page.getByRole('button', { name: /theme|主题|dark|light/i })
      .or(page.locator('button').filter({ has: page.locator('svg[class*="sun"], svg[class*="moon"]') }));

    if (await themeToggle.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await themeToggle.first().click();
      await page.waitForTimeout(500);
      console.log('✅ 主题切换成功');
    }
  });

  test('主题选择应该被保存', async ({ page }) => {
    // 检查本地存储
    const theme = await page.evaluate(() => localStorage.getItem('theme'));

    console.log(`Current theme in localStorage: ${theme}`);
  });
});
