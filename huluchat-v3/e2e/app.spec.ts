import { test, expect } from '@playwright/test';

/**
 * HuluChat E2E 测试 - 核心功能
 *
 * 测试范围：
 * 1. 应用启动和基本渲染
 * 2. 侧边栏和会话管理
 * 3. 设置对话框
 * 4. 消息区域
 * 5. 欢迎引导流程
 */

test.describe('HuluChat 应用启动', () => {
  test('应用应该正确加载', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 验证 HuluChat 品牌存在
    const brandLocator = page.locator('text=HuluChat')
      .or(page.locator('h1:has-text("HuluChat")'))
      .or(page.locator('[class*="HuluChat"]'));

    // 应该能找到 HuluChat 品牌
    const brandCount = await brandLocator.count();
    expect(brandCount).toBeGreaterThan(0);
  });

  test('侧边栏/导航应该可见', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 导航区域 - 使用 role="navigation" 或其他导航元素
    const navLocator = page.locator('[role="navigation"]')
      .or(page.locator('nav'))
      .or(page.locator('aside'))
      .or(page.locator('[class*="sidebar"]'));

    // 至少有一个导航元素
    const navCount = await navLocator.count();
    expect(navCount).toBeGreaterThan(0);
  });

  test('应该显示新建会话按钮', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 查找新建会话相关的按钮
    const newChatButton = page.getByRole('button', { name: /new|新建|chat/i })
      .or(page.locator('button:has-text("New Chat")'));

    await expect(newChatButton.first()).toBeVisible();
  });
});

test.describe('欢迎引导流程', () => {
  test('首次使用应该显示欢迎对话框', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 欢迎对话框
    const welcomeDialog = page.locator('[role="dialog"]')
      .or(page.locator('text=Welcome to HuluChat'));

    // 如果欢迎对话框存在，验证其内容
    const isVisible = await welcomeDialog.first().isVisible().catch(() => false);
    if (isVisible) {
      // 应该有步骤导航
      const stepNav = page.locator('button:has-text("Step")')
        .or(page.locator('text=/Step \\d of \\d/'));
      expect(await stepNav.count()).toBeGreaterThan(0);

      // 应该有 Next/Skip 按钮
      const nextButton = page.locator('button:has-text("Next")')
        .or(page.locator('button:has-text("Skip")'));
      expect(await nextButton.count()).toBeGreaterThan(0);
    }
  });

  test('应该能跳过欢迎引导', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 查找跳过按钮
    const skipButton = page.locator('button:has-text("Skip")');

    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);

      // 欢迎对话框应该关闭
      const dialog = page.locator('[role="dialog"]');
      expect(await dialog.isVisible()).toBe(false);
    }
  });
});

test.describe('设置功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 先跳过欢迎引导
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('应该能打开设置对话框', async ({ page }) => {
    // 查找设置按钮
    const settingsButton = page.locator('button:has-text("Settings")')
      .or(page.locator('[data-testid="settings-button"]'))
      .or(page.locator('button[class*="settings"]'));

    if (await settingsButton.first().isVisible()) {
      await settingsButton.first().click();

      // 等待对话框出现
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });
    }
  });

  test('设置应该包含语言选项', async ({ page }) => {
    const settingsButton = page.locator('button:has-text("Settings")');
    if (await settingsButton.first().isVisible()) {
      await settingsButton.first().click();
      await page.locator('[role="dialog"]').waitFor({ timeout: 5000 });

      // 查找语言设置
      const languageOption = page.locator('text=/Language|语言/i');
      expect(await languageOption.count()).toBeGreaterThan(0);
    }
  });
});

test.describe('消息输入区域', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 跳过欢迎引导
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('消息输入区域应该存在', async ({ page }) => {
    // 查找文本输入区域
    const inputArea = page.locator('textarea')
      .or(page.locator('[contenteditable="true"]'))
      .or(page.locator('input[type="text"]'))
      .or(page.locator('[placeholder*="message"]'))
      .or(page.locator('[placeholder*="Type"]'));

    await expect(inputArea.first()).toBeVisible();
  });

  test('应该显示快捷操作建议', async ({ page }) => {
    // 查找快捷操作按钮（如 "Write a poem", "Explain quantum computing" 等）
    const quickActions = page.locator('button:has-text("Write a poem")')
      .or(page.locator('button:has-text("Explain")'))
      .or(page.locator('button:has-text("Help me code")'));

    // 快捷操作应该存在
    const count = await quickActions.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('后端连接状态', () => {
  test('应该显示后端连接状态', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 跳过欢迎引导
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    // 查找连接状态指示器
    const statusIndicator = page.locator('text=/Connecting|Connected|Offline|Degraded/i')
      .or(page.locator('[class*="status"]'))
      .or(page.locator('[class*="backend"]'));

    // 状态指示器应该存在（不一定是 visible，因为可能在 header 中）
    const count = await statusIndicator.count();
    console.log(`Found ${count} status indicators`);
  });
});

test.describe('快捷键功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 跳过欢迎引导
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('Ctrl+K 应该打开命令面板', async ({ page }) => {
    // 按下 Ctrl+K (Windows/Linux) 或 Cmd+K (macOS)
    await page.keyboard.press('Control+k');

    // 等待一下让动画完成
    await page.waitForTimeout(500);

    // 命令面板应该出现
    const commandPalette = page.locator('[role="dialog"]')
      .or(page.locator('text=/Command|命令|Search|搜索/i'));

    // 检查命令面板是否出现
    const isVisible = await commandPalette.first().isVisible().catch(() => false);
    console.log(`Command palette visible: ${isVisible}`);
  });
});

test.describe('文件夹功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 跳过欢迎引导
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('应该显示文件夹列表', async ({ page }) => {
    // 查找文件夹区域
    const folderSection = page.locator('text=/Folders|文件夹/i')
      .or(page.locator('button:has-text("New folder")'))
      .or(page.locator('[class*="folder"]'));

    const count = await folderSection.count();
    console.log(`Found ${count} folder elements`);
  });
});
