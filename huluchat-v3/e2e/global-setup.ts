import { test as setup } from '@playwright/test';

/**
 * 全局测试配置
 * 处理对话框遮罩层等常见问题
 */

// 在每个测试前注入辅助函数
setup.beforeEach(async ({ page }) => {
  // 注入全局辅助函数来处理遮罩层
  await page.addLocatorHandler(
    page.locator('[data-state="open"][aria-hidden="true"]'),
    async () => {
      // 尝试按 ESC 键关闭对话框
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
  );
});

// 导出配置
export const expect = setup.expect;
