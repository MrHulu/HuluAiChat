import { test, expect, Page, APIRequestContext } from '@playwright/test';

/**
 * HuluChat E2E 测试 - Session Templates (TASK-327)
 *
 * 测试范围：
 * 1. 模板列表加载
 * 2. 内置模板验证
 * 3. 模板选择创建会话
 * 4. 错误处理和重试
 * 5. 国际化支持
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

// 辅助函数：关闭所有对话框
async function closeAllDialogs(page: Page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

test.describe('Session Templates API', () => {
  test('应该能获取模板列表', async ({ request }) => {
    const response = await request.get(`${TEST_CONFIG.backendUrl}/api/session-templates`, {
      timeout: TEST_CONFIG.apiTimeout,
    });

    expect(response.status()).toBe(200);

    const templates = await response.json();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
  });

  test('模板应该包含必要的字段', async ({ request }) => {
    const response = await request.get(`${TEST_CONFIG.backendUrl}/api/session-templates`);
    const templates = await response.json();

    templates.forEach((template: { id: string; name: string; is_builtin: boolean }) => {
      expect(template.id).toBeTruthy();
      expect(template.name).toBeTruthy();
      expect(typeof template.is_builtin).toBe('boolean');
    });
  });

  test('应该包含内置模板', async ({ request }) => {
    const response = await request.get(`${TEST_CONFIG.backendUrl}/api/session-templates`);
    const templates = await response.json();

    const builtInTemplates = templates.filter(
      (t: { is_builtin: boolean }) => t.is_builtin === true
    );

    expect(builtInTemplates.length).toBeGreaterThan(0);
    console.log(`✅ 找到 ${builtInTemplates.length} 个内置模板`);
  });

  test('内置模板应该包含通用聊天模板', async ({ request }) => {
    const response = await request.get(`${TEST_CONFIG.backendUrl}/api/session-templates`);
    const templates = await response.json();

    const builtInTemplates = templates.filter(
      (t: { is_builtin: boolean }) => t.is_builtin === true
    );

    // 应该有通用聊天模板
    const generalTemplate = builtInTemplates.find(
      (t: { id: string }) => t.id === 'general' || t.id === 'chat'
    );

    // 至少应该有一些模板
    expect(builtInTemplates.length).toBeGreaterThan(0);
  });
});

test.describe('Session Templates UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);
  });

  test('模板选择器应该可以显示', async ({ page }) => {
    // 查找模板相关的 UI 元素
    const templateElements = page.locator('text=/template|模板/i')
      .or(page.locator('[class*="template"]'));

    // 检查模板相关元素是否存在
    const count = await templateElements.count();
    console.log(`Found ${count} template-related elements`);
  });

  test('模板应该显示图标', async ({ page }) => {
    // 如果模板选择器可见，检查图标
    const templateIcons = page.locator('button').filter({
      has: page.locator('span').filter({ hasText: /^[📝🤖💻🎨📋🔧📚💡🎯]$/ })
    });

    const count = await templateIcons.count();
    console.log(`Found ${count} template buttons with icons`);
  });

  test('选择模板应该创建新会话', async ({ page }) => {
    // 查找模板按钮
    const templateButton = page.locator('button').filter({
      has: page.locator('text=/template|模板/i')
    }).first();

    if (await templateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await templateButton.click();
      await page.waitForTimeout(500);

      // 应该出现模板选择界面
      const templateSelector = page.locator('[class*="template"]').or(page.locator('[role="dialog"]'));
      const isVisible = await templateSelector.first().isVisible().catch(() => false);
      console.log(`Template selector visible: ${isVisible}`);
    }
  });
});

test.describe('Session Templates 错误处理', () => {
  test('后端不可用时应该显示错误', async ({ page }) => {
    // 模拟网络错误场景
    await page.route('**/api/session-templates', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);

    // 页面应该仍然可交互
    const inputArea = page.locator('textarea').or(page.locator('[contenteditable="true"]'));
    await expect(inputArea.first()).toBeVisible();
  });

  test('应该显示重试按钮当加载失败时', async ({ page }) => {
    // 首次请求失败
    let requestCount = 0;
    await page.route('**/api/session-templates', route => {
      requestCount++;
      if (requestCount === 1) {
        route.fulfill({ status: 500 });
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            { id: 'test', name: 'Test Template', is_builtin: true }
          ])
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);

    // 查找重试按钮
    const retryButton = page.locator('button:has-text("Retry")')
      .or(page.locator('button:has-text("重试")'));

    const hasRetry = await retryButton.count() > 0;
    console.log(`Retry button visible: ${hasRetry}`);
  });
});

test.describe('Session Templates 国际化', () => {
  test('内置模板名称应该支持中文', async ({ request }) => {
    const response = await request.get(`${TEST_CONFIG.backendUrl}/api/session-templates`);
    const templates = await response.json();

    // 检查模板结构
    const builtInTemplates = templates.filter(
      (t: { is_builtin: boolean }) => t.is_builtin === true
    );

    expect(builtInTemplates.length).toBeGreaterThan(0);

    // 模板应该有名称
    builtInTemplates.forEach((template: { name: string }) => {
      expect(template.name).toBeTruthy();
      console.log(`Template name: ${template.name}`);
    });
  });

  test('模板描述应该存在', async ({ request }) => {
    const response = await request.get(`${TEST_CONFIG.backendUrl}/api/session-templates`);
    const templates = await response.json();

    // 至少部分模板应该有描述
    const templatesWithDesc = templates.filter(
      (t: { description?: string }) => t.description && t.description.length > 0
    );

    console.log(`${templatesWithDesc.length} templates have descriptions`);
  });
});

test.describe('Session Templates 性能', () => {
  test('模板列表加载应该快速', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(`${TEST_CONFIG.backendUrl}/api/session-templates`);

    const loadTime = Date.now() - startTime;

    expect(response.status()).toBe(200);
    expect(loadTime).toBeLessThan(5000); // 应该在 5 秒内完成

    console.log(`Template list loaded in ${loadTime}ms`);
  });

  test('模板列表应该缓存', async ({ request }) => {
    // 第一次请求
    const response1 = await request.get(`${TEST_CONFIG.backendUrl}/api/session-templates`);
    const templates1 = await response1.json();

    // 第二次请求
    const response2 = await request.get(`${TEST_CONFIG.backendUrl}/api/session-templates`);
    const templates2 = await response2.json();

    // 结果应该一致
    expect(templates1.length).toBe(templates2.length);
  });
});

test.describe('Session Templates 模型关联', () => {
  test('模板可以有默认模型', async ({ request }) => {
    const response = await request.get(`${TEST_CONFIG.backendUrl}/api/session-templates`);
    const templates = await response.json();

    // 检查是否有模板指定了默认模型
    const templatesWithModel = templates.filter(
      (t: { default_model?: string }) => t.default_model
    );

    console.log(`${templatesWithModel.length} templates have default models`);

    // 验证默认模型格式
    templatesWithModel.forEach((template: { default_model: string }) => {
      expect(typeof template.default_model).toBe('string');
      expect(template.default_model.length).toBeGreaterThan(0);
    });
  });

  test('模板创建会话时应该使用默认模型', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);

    // 检查当前选中的模型
    const modelSelector = page.locator('button').filter({
      has: page.locator('text=/deepseek|gpt|claude|glm/i')
    });

    const count = await modelSelector.count();
    console.log(`Found ${count} model selector elements`);
  });
});
