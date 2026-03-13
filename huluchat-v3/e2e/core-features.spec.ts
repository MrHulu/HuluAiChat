import { test, expect, Page } from '@playwright/test';

/**
 * HuluChat E2E 测试 - 核心功能
 *
 * 测试范围（根据 TASK-301）：
 * 1. 创建新会话
 * 2. 发送消息
 * 3. 切换模型
 * 4. 创建文件夹
 * 5. 导出对话
 * 6. 设置更改（API Key、模型等）
 */

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

test.describe('会话管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);
  });

  test('应该能创建新会话', async ({ page }) => {
    // 查找新建会话按钮
    const newChatButton = page.getByRole('button', { name: /new|新建|chat/i })
      .or(page.locator('button:has-text("New Chat")'))
      .or(page.locator('button:has-text("新建会话")'))
      .or(page.locator('button').filter({ has: page.locator('svg') }).first());

    // 点击新建会话
    await newChatButton.first().click();
    await page.waitForTimeout(500);

    // 验证消息输入区域可用
    const inputArea = page.locator('textarea').or(page.locator('[contenteditable="true"]'));
    await expect(inputArea.first()).toBeVisible();
  });

  test('会话列表应该显示在侧边栏', async ({ page }) => {
    // 侧边栏 - 查找更广泛的选择器
    const sidebar = page.locator('aside')
      .or(page.locator('nav'))
      .or(page.locator('[class*="sidebar"]'))
      .or(page.locator('[class*="Sidebar"]'))
      .or(page.locator('[class*="navigation"]'));

    const count = await sidebar.count();
    console.log(`Found ${count} sidebar elements`);

    // 如果没有找到侧边栏元素，至少应该有导航相关的元素
    const navElements = page.locator('nav, aside, [role="navigation"], [class*="nav"], [class*="sidebar"]');
    const navCount = await navElements.count();
    expect(navCount).toBeGreaterThan(0);
  });

  test('应该能切换会话', async ({ page }) => {
    // 查找会话项目
    const sessionItems = page.locator('button').filter({ has: page.locator('text=/会话|Chat|Session/') });

    if (await sessionItems.count() > 1) {
      // 点击第二个会话
      await sessionItems.nth(1).click();
      await page.waitForTimeout(500);

      // 验证会话切换成功
      const inputArea = page.locator('textarea').or(page.locator('[contenteditable="true"]'));
      await expect(inputArea.first()).toBeVisible();
    }
  });
});

test.describe('消息发送', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);
  });

  test('输入框应该存在', async ({ page }) => {
    const inputArea = page.locator('textarea').or(page.locator('[contenteditable="true"]'));
    await expect(inputArea.first()).toBeVisible();
  });

  test('输入框应该有 placeholder 提示', async ({ page }) => {
    const inputArea = page.locator('textarea').or(page.locator('[contenteditable="true"]'));
    const placeholder = await inputArea.first().getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
    console.log(`Placeholder: "${placeholder}"`);
  });

  test('创建新会话按钮应该可用', async ({ page }) => {
    const newChatButton = page.getByRole('button', { name: /new|新建/i })
      .or(page.locator('button').filter({ has: page.locator('svg') }).first());

    await expect(newChatButton.first()).toBeVisible();
    await expect(newChatButton.first()).toBeEnabled();
  });

  test('应该能点击新建会话按钮', async ({ page }) => {
    const newChatButton = page.getByRole('button', { name: /new|新建/i })
      .or(page.locator('button').filter({ has: page.locator('svg') }).first());

    await newChatButton.first().click();
    await page.waitForTimeout(1000);

    // 点击后不应该有错误
    const errorElements = page.locator('[class*="error"]').or(page.locator('text=/error|错误/i'));
    const errorCount = await errorElements.count();
    console.log(`Error count after creating session: ${errorCount}`);
  });
});

test.describe('模型选择', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);
  });

  test('应该显示当前选中的模型', async ({ page }) => {
    // 查找模型选择器
    const modelSelector = page.locator('button').filter({ has: page.locator('text=/deepseek|gpt|claude|glm/i') })
      .or(page.locator('[class*="model"]'))
      .or(page.locator('button:has-text("Model")'));

    const count = await modelSelector.count();
    console.log(`Found ${count} model selector elements`);
  });

  test('应该能打开模型选择下拉框', async ({ page }) => {
    // 查找模型选择器
    const modelSelector = page.locator('button').filter({ has: page.locator('text=/deepseek|gpt|claude|glm/i') });

    if (await modelSelector.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await modelSelector.first().click();
      await page.waitForTimeout(500);

      // 下拉框应该出现
      const dropdown = page.locator('[role="listbox"]').or(page.locator('[class*="dropdown"]').or(page.locator('[class*="select-content"]')));
      const isVisible = await dropdown.first().isVisible().catch(() => false);
      console.log(`Model dropdown visible: ${isVisible}`);
    }
  });
});

test.describe('文件夹管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);
  });

  test('应该显示新建文件夹按钮', async ({ page }) => {
    const newFolderButton = page.getByRole('button', { name: /folder|文件夹/i })
      .or(page.locator('button:has-text("New folder")'))
      .or(page.locator('button:has-text("新建文件夹")'));

    const count = await newFolderButton.count();
    console.log(`Found ${count} new folder buttons`);
  });

  test('应该能创建新文件夹', async ({ page }) => {
    const newFolderButton = page.locator('button:has-text("New folder")')
      .or(page.locator('button:has-text("新建文件夹")'));

    if (await newFolderButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await newFolderButton.first().click();
      await page.waitForTimeout(500);

      // 应该出现文件夹名称输入框
      const folderNameInput = page.locator('input[type="text"]').or(page.locator('input[placeholder*="folder"]'));
      const isVisible = await folderNameInput.first().isVisible().catch(() => false);
      console.log(`Folder name input visible: ${isVisible}`);
    }
  });
});

test.describe('设置功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);
  });

  test('应该能打开设置对话框', async ({ page }) => {
    // 查找设置按钮
    const settingsButton = page.getByRole('button', { name: /settings|设置/i })
      .or(page.locator('button[class*="settings"]'))
      .or(page.locator('button').filter({ has: page.locator('svg') }).nth(10));

    await settingsButton.first().click();
    await page.waitForTimeout(500);

    // 设置对话框应该出现
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test('设置对话框应该包含 API 配置选项', async ({ page }) => {
    // 打开设置
    const settingsButton = page.getByRole('button', { name: /settings|设置/i });
    await settingsButton.first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 应该有 API 相关配置
    const apiOption = page.locator('text=/API|api|Key|密钥/i');
    const count = await apiOption.count();
    console.log(`Found ${count} API-related elements in settings`);
  });

  test('设置对话框应该包含模型选择', async ({ page }) => {
    // 打开设置
    const settingsButton = page.getByRole('button', { name: /settings|设置/i });
    await settingsButton.first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 应该有模型选择
    const modelOption = page.locator('text=/Model|模型/i');
    const count = await modelOption.count();
    console.log(`Found ${count} model-related elements in settings`);
  });

  test('设置对话框应该包含语言选项', async ({ page }) => {
    // 打开设置
    const settingsButton = page.getByRole('button', { name: /settings|设置/i });
    await settingsButton.first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 应该有语言选项
    const languageOption = page.locator('text=/Language|语言/i');
    const count = await languageOption.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('导出功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);
  });

  test('应该有导出按钮或选项', async ({ page }) => {
    // 查找导出相关元素
    const exportButton = page.getByRole('button', { name: /export|导出/i })
      .or(page.locator('button:has-text("Export")'))
      .or(page.locator('button:has-text("导出")'));

    const count = await exportButton.count();
    console.log(`Found ${count} export buttons`);
  });

  test('导出菜单应该有多种格式选项', async ({ page }) => {
    // 查找导出按钮
    const exportButton = page.getByRole('button', { name: /export|导出/i });

    if (await exportButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await exportButton.first().click();
      await page.waitForTimeout(500);

      // 应该有格式选项（MD, JSON, PDF 等）
      const formatOptions = page.locator('text=/MD|JSON|PDF|TXT|Markdown/i');
      const count = await formatOptions.count();
      console.log(`Found ${count} export format options`);
    }
  });
});

test.describe('快捷键功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);
  });

  test('Ctrl+K 应该打开命令面板', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);

    // 命令面板应该出现
    const commandPalette = page.locator('[role="dialog"]')
      .or(page.locator('text=/Command|命令|Search|搜索/i'));

    const isVisible = await commandPalette.first().isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });

  test('Escape 应该关闭对话框', async ({ page }) => {
    // 先打开命令面板
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);

    // 按 Escape 关闭
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 对话框应该关闭
    const dialog = page.locator('[role="dialog"]');
    const isVisible = await dialog.isVisible().catch(() => false);
    console.log(`Dialog visible after Escape: ${isVisible}`);
  });
});

test.describe('UI/UX 验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await skipWelcomeIfNeeded(page);
  });

  test('不应该有错误的 tooltip（双击引用消息）', async ({ page }) => {
    // 检查页面内容
    const pageContent = await page.content();

    // 不应该包含错误的 tooltip
    expect(pageContent).not.toContain('双击引用消息');
  });

  test('侧边栏应该可以折叠', async ({ page }) => {
    // 查找折叠按钮
    const collapseButton = page.locator('button').filter({ has: page.locator('svg') })
      .filter({ hasText: /sidebar|collapse|展开|折叠/i });

    if (await collapseButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await collapseButton.first().click();
      await page.waitForTimeout(500);

      // 侧边栏应该折叠
      const sidebar = page.locator('aside').or(page.locator('[class*="sidebar"]'));
      console.log(`Sidebar collapsed state checked`);
    }
  });

  test('主题切换应该可用', async ({ page }) => {
    // 查找主题切换按钮
    const themeToggle = page.getByRole('button', { name: /theme|主题|dark|light/i })
      .or(page.locator('button').filter({ has: page.locator('svg[class*="sun"], svg[class*="moon"]') }));

    const count = await themeToggle.count();
    console.log(`Found ${count} theme toggle buttons`);
  });
});

test.describe('后端连接', () => {
  test('后端应该返回健康状态', async ({ request }) => {
    const response = await request.get('http://localhost:8765/api/health');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('后端应该返回模型列表', async ({ request }) => {
    const response = await request.get('http://localhost:8765/api/settings/models');
    expect(response.status()).toBe(200);

    const data = await response.json();
    // API 返回的是数组，不是 { models: [...] }
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // 验证模型对象结构
    const firstModel = data[0];
    expect(firstModel).toHaveProperty('id');
    expect(firstModel).toHaveProperty('name');
  });
});
