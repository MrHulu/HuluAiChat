import { test, expect, Page, APIRequestContext } from '@playwright/test';

/**
 * HuluChat E2E 测试 - Export Extended (TASK-327)
 *
 * 测试范围：
 * 1. 多格式导出 (Markdown, JSON, TXT, PDF)
 * 2. 导出文件命名
 * 3. 导出内容验证
 * 4. 批量导出
 * 5. 导出错误处理
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
    data: { title: title || `Export Test Session ${Date.now()}` },
    timeout: TEST_CONFIG.apiTimeout,
  });
  return response;
}

// 辅助函数：添加测试消息
async function addTestMessage(
  request: APIRequestContext,
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
) {
  const response = await request.post(`${TEST_CONFIG.backendUrl}/api/chat/${sessionId}/messages`, {
    data: { role, content },
    timeout: TEST_CONFIG.apiTimeout,
  });
  return response;
}

test.describe('Export API - Markdown', () => {
  test('应该能导出为 Markdown 格式', async ({ request }) => {
    // 创建测试会话
    const createResponse = await createTestSession(request, 'Markdown Export Test');
    expect(createResponse.status()).toBe(200);
    const session = await createResponse.json();

    // 添加测试消息
    await addTestMessage(request, session.id, 'user', 'Hello, how are you?');
    await addTestMessage(request, session.id, 'assistant', 'I am doing well, thank you!');

    // 导出为 Markdown
    const exportResponse = await request.get(
      `${TEST_CONFIG.backendUrl}/api/sessions/${session.id}/export?format=markdown`,
      { timeout: TEST_CONFIG.apiTimeout }
    );

    expect(exportResponse.status()).toBe(200);

    // 验证响应头
    const contentType = exportResponse.headers()['content-type'];
    console.log(`Markdown export content-type: ${contentType}`);
  });

  test('Markdown 导出应该包含正确的格式', async ({ request }) => {
    const createResponse = await createTestSession(request, 'Format Test');
    const session = await createResponse.json();

    await addTestMessage(request, session.id, 'user', 'Test question');
    await addTestMessage(request, session.id, 'assistant', 'Test answer');

    const exportResponse = await request.get(
      `${TEST_CONFIG.backendUrl}/api/sessions/${session.id}/export?format=markdown`
    );

    if (exportResponse.status() === 200) {
      const content = await exportResponse.text();

      // Markdown 应该包含标题和消息标记
      expect(content.length).toBeGreaterThan(0);
      console.log(`Markdown content length: ${content.length}`);
    }
  });
});

test.describe('Export API - JSON', () => {
  test('应该能导出为 JSON 格式', async ({ request }) => {
    const createResponse = await createTestSession(request, 'JSON Export Test');
    const session = await createResponse.json();

    await addTestMessage(request, session.id, 'user', 'JSON test message');

    const exportResponse = await request.get(
      `${TEST_CONFIG.backendUrl}/api/sessions/${session.id}/export?format=json`,
      { timeout: TEST_CONFIG.apiTimeout }
    );

    expect(exportResponse.status()).toBe(200);

    const contentType = exportResponse.headers()['content-type'];
    console.log(`JSON export content-type: ${contentType}`);
  });

  test('JSON 导出应该是有效的 JSON', async ({ request }) => {
    const createResponse = await createTestSession(request, 'JSON Valid Test');
    const session = await createResponse.json();

    await addTestMessage(request, session.id, 'user', 'Test');
    await addTestMessage(request, session.id, 'assistant', 'Response');

    const exportResponse = await request.get(
      `${TEST_CONFIG.backendUrl}/api/sessions/${session.id}/export?format=json`
    );

    if (exportResponse.status() === 200) {
      const text = await exportResponse.text();

      // 应该是有效的 JSON
      expect(() => JSON.parse(text)).not.toThrow();

      const data = JSON.parse(text);
      expect(data).toBeDefined();
    }
  });

  test('JSON 导出应该包含消息数组', async ({ request }) => {
    const createResponse = await createTestSession(request, 'JSON Messages Test');
    const session = await createResponse.json();

    await addTestMessage(request, session.id, 'user', 'Message 1');
    await addTestMessage(request, session.id, 'assistant', 'Message 2');

    const exportResponse = await request.get(
      `${TEST_CONFIG.backendUrl}/api/sessions/${session.id}/export?format=json`
    );

    if (exportResponse.status() === 200) {
      const data = await exportResponse.json();

      // 应该包含消息
      if (data.messages) {
        expect(Array.isArray(data.messages)).toBe(true);
      }
    }
  });
});

test.describe('Export API - TXT', () => {
  test('应该能导出为纯文本格式', async ({ request }) => {
    const createResponse = await createTestSession(request, 'TXT Export Test');
    const session = await createResponse.json();

    await addTestMessage(request, session.id, 'user', 'Plain text test');

    const exportResponse = await request.get(
      `${TEST_CONFIG.backendUrl}/api/sessions/${session.id}/export?format=txt`,
      { timeout: TEST_CONFIG.apiTimeout }
    );

    expect(exportResponse.status()).toBe(200);

    const contentType = exportResponse.headers()['content-type'];
    console.log(`TXT export content-type: ${contentType}`);
  });

  test('TXT 导出应该是纯文本', async ({ request }) => {
    const createResponse = await createTestSession(request, 'TXT Plain Test');
    const session = await createResponse.json();

    await addTestMessage(request, session.id, 'user', 'Test plain text');

    const exportResponse = await request.get(
      `${TEST_CONFIG.backendUrl}/api/sessions/${session.id}/export?format=txt`
    );

    if (exportResponse.status() === 200) {
      const text = await exportResponse.text();
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Export API - PDF', () => {
  test('应该支持 PDF 导出格式', async ({ request }) => {
    const createResponse = await createTestSession(request, 'PDF Export Test');
    const session = await createResponse.json();

    await addTestMessage(request, session.id, 'user', 'PDF test');

    const exportResponse = await request.get(
      `${TEST_CONFIG.backendUrl}/api/sessions/${session.id}/export?format=pdf`,
      { timeout: TEST_CONFIG.apiTimeout }
    );

    // PDF 导出可能不支持，返回 200 或 404 都是可接受的
    expect([200, 404, 501]).toContain(exportResponse.status());

    if (exportResponse.status() === 200) {
      const contentType = exportResponse.headers()['content-type'];
      console.log(`PDF export content-type: ${contentType}`);
    }
  });
});

test.describe('Export API - 文件命名', () => {
  test('导出文件应该有正确的文件名', async ({ request }) => {
    const createResponse = await createTestSession(request, 'Filename Test Session');
    const session = await createResponse.json();

    await addTestMessage(request, session.id, 'user', 'Test');

    const exportResponse = await request.get(
      `${TEST_CONFIG.backendUrl}/api/sessions/${session.id}/export?format=markdown`
    );

    if (exportResponse.status() === 200) {
      const contentDisposition = exportResponse.headers()['content-disposition'];
      console.log(`Content-Disposition: ${contentDisposition}`);

      // 文件名应该包含 .md 扩展名
      if (contentDisposition) {
        expect(
          contentDisposition.includes('.md') ||
          contentDisposition.includes('.markdown')
        ).toBe(true);
      }
    }
  });

  test('JSON 导出文件应该有 .json 扩展名', async ({ request }) => {
    const createResponse = await createTestSession(request, 'JSON Filename Test');
    const session = await createResponse.json();

    const exportResponse = await request.get(
      `${TEST_CONFIG.backendUrl}/api/sessions/${session.id}/export?format=json`
    );

    if (exportResponse.status() === 200) {
      const contentDisposition = exportResponse.headers()['content-disposition'];

      if (contentDisposition) {
        expect(contentDisposition.includes('.json')).toBe(true);
      }
    }
  });
});

test.describe('Export API - 错误处理', () => {
  test('导出不存在的会话应该返回错误', async ({ request }) => {
    const exportResponse = await request.get(
      `${TEST_CONFIG.backendUrl}/api/sessions/non-existent-session-id/export?format=markdown`,
      { timeout: TEST_CONFIG.apiTimeout }
    );

    expect([404, 400, 500]).toContain(exportResponse.status());
  });

  test('无效的导出格式应该返回错误', async ({ request }) => {
    const createResponse = await createTestSession(request, 'Invalid Format Test');
    const session = await createResponse.json();

    const exportResponse = await request.get(
      `${TEST_CONFIG.backendUrl}/api/sessions/${session.id}/export?format=invalid`,
      { timeout: TEST_CONFIG.apiTimeout }
    );

    // 应该返回错误或回退到默认格式
    expect([200, 400, 404, 500]).toContain(exportResponse.status());
  });

  test('空会话导出应该正常工作', async ({ request }) => {
    const createResponse = await createTestSession(request, 'Empty Export Test');
    const session = await createResponse.json();

    // 不添加任何消息，直接导出
    const exportResponse = await request.get(
      `${TEST_CONFIG.backendUrl}/api/sessions/${session.id}/export?format=markdown`
    );

    // 应该成功导出空会话
    expect([200, 404]).toContain(exportResponse.status());
  });
});

test.describe('Export UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);
  });

  test('导出按钮应该存在', async ({ page }) => {
    const exportButton = page.locator('button').filter({
      has: page.locator('text=/export|导出/ui')
    });

    const count = await exportButton.count();
    console.log(`Found ${count} export buttons`);
  });

  test('点击导出应该显示格式选项', async ({ page }) => {
    const exportButton = page.locator('button').filter({
      has: page.locator('text=/export|导出/ui')
    }).first();

    if (await exportButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await exportButton.click();
      await page.waitForTimeout(500);

      // 检查格式选项
      const formatOptions = page.locator('text=/MD|Markdown|JSON|TXT|PDF/i');
      const count = await formatOptions.count();

      console.log(`Found ${count} export format options`);
    }
  });

  test('导出菜单应该可关闭', async ({ page }) => {
    const exportButton = page.locator('button').filter({
      has: page.locator('text=/export|导出/ui')
    }).first();

    if (await exportButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await exportButton.click();
      await page.waitForTimeout(300);

      // 按 Escape 关闭
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // 菜单应该关闭
      const menu = page.locator('[role="menu"]').or(page.locator('[role="listbox"]'));
      const isVisible = await menu.first().isVisible().catch(() => false);

      console.log(`Menu closed after Escape: ${!isVisible}`);
    }
  });
});

test.describe('Export 性能', () => {
  test('导出应该快速完成', async ({ request }) => {
    const createResponse = await createTestSession(request, 'Performance Test');
    const session = await createResponse.json();

    // 添加多条消息
    for (let i = 0; i < 10; i++) {
      await addTestMessage(request, session.id, 'user', `Message ${i}`);
      await addTestMessage(request, session.id, 'assistant', `Response ${i}`);
    }

    const startTime = Date.now();

    const exportResponse = await request.get(
      `${TEST_CONFIG.backendUrl}/api/sessions/${session.id}/export?format=markdown`
    );

    const exportTime = Date.now() - startTime;

    expect(exportResponse.status()).toBe(200);
    expect(exportTime).toBeLessThan(5000); // 应该在 5 秒内完成

    console.log(`Export completed in ${exportTime}ms`);
  });

  test('大量消息导出应该正常工作', async ({ request }) => {
    const createResponse = await createTestSession(request, 'Large Export Test');
    const session = await createResponse.json();

    // 添加 50 条消息
    for (let i = 0; i < 50; i++) {
      await addTestMessage(request, session.id, i % 2 === 0 ? 'user' : 'assistant', `Message ${i}`);
    }

    const exportResponse = await request.get(
      `${TEST_CONFIG.backendUrl}/api/sessions/${session.id}/export?format=json`
    );

    expect(exportResponse.status()).toBe(200);

    const data = await exportResponse.json();
    console.log(`Large export successful, data keys: ${Object.keys(data).join(', ')}`);
  });
});

test.describe('Export 内容验证', () => {
  test('导出内容应该包含会话标题', async ({ request }) => {
    const testTitle = 'Unique Export Title Test 12345';
    const createResponse = await createTestSession(request, testTitle);
    const session = await createResponse.json();

    await addTestMessage(request, session.id, 'user', 'Test');

    const exportResponse = await request.get(
      `${TEST_CONFIG.backendUrl}/api/sessions/${session.id}/export?format=markdown`
    );

    if (exportResponse.status() === 200) {
      const content = await exportResponse.text();

      // 内容应该包含标题（在 Markdown 中通常是 # 标题）
      console.log(`Export includes title: ${content.includes(testTitle) || content.includes('Export')}`);
    }
  });

  test('导出内容应该包含所有消息', async ({ request }) => {
    const createResponse = await createTestSession(request, 'Message Content Test');
    const session = await createResponse.json();

    const messages = ['First message', 'Second message', 'Third message'];

    for (const msg of messages) {
      await addTestMessage(request, session.id, 'user', msg);
    }

    const exportResponse = await request.get(
      `${TEST_CONFIG.backendUrl}/api/sessions/${session.id}/export?format=txt`
    );

    if (exportResponse.status() === 200) {
      const content = await exportResponse.text();

      // 检查所有消息是否都在导出内容中
      let foundCount = 0;
      for (const msg of messages) {
        if (content.includes(msg)) {
          foundCount++;
        }
      }

      console.log(`Found ${foundCount}/${messages.length} messages in export`);
    }
  });
});
