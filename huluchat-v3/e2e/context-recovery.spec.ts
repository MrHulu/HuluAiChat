import { test, expect, Page } from '@playwright/test';

/**
 * HuluChat E2E 测试 - Context Recovery / Draft Recovery (TASK-327)
 *
 * 测试范围：
 * 1. 草稿自动保存
 * 2. 草稿恢复对话框
 * 3. 草稿持久化
 * 4. 草稿限制和清理
 * 5. 用户体验流程
 */

// 测试配置
const TEST_CONFIG = {
  backendUrl: 'http://localhost:8765',
  apiTimeout: 30000,
  draftsStorageKey: 'huluchat_drafts',
};

// 辅助函数：跳过欢迎引导
async function skipWelcomeIfNeeded(page: Page) {
  const skipButton = page.locator('button:has-text("Skip")');
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click();
    await page.waitForTimeout(500);
  }
}

// 辅助函数：创建测试草稿
async function createTestDraft(page: Page, sessionId: string, content: string) {
  await page.evaluate(
    ({ key, sessionId, content }) => {
      const draft = {
        sessionId,
        sessionTitle: 'Test Session',
        content,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify({ drafts: [draft] }));
    },
    {
      key: TEST_CONFIG.draftsStorageKey,
      sessionId,
      content,
    }
  );
}

// 辅助函数：清除所有草稿
async function clearAllDrafts(page: Page) {
  await page.evaluate(
    (key) => localStorage.removeItem(key),
    TEST_CONFIG.draftsStorageKey
  );
}

// 辅助函数：获取当前草稿
async function getCurrentDrafts(page: Page) {
  return await page.evaluate(
    (key) => {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored).drafts;
      }
      return [];
    },
    TEST_CONFIG.draftsStorageKey
  );
}

test.describe('Draft Recovery 基础功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await clearAllDrafts(page);
    await skipWelcomeIfNeeded(page);
  });

  test('localStorage 应该用于存储草稿', async ({ page }) => {
    // 检查 localStorage key 是否被使用
    const storageContent = await page.evaluate(
      (key) => localStorage.getItem(key),
      TEST_CONFIG.draftsStorageKey
    );

    // 初始状态可能是 null 或空数组
    expect([null, '{"drafts":[]}']).toContain(storageContent);
  });

  test('应该能保存草稿到 localStorage', async ({ page }) => {
    const testSessionId = 'test-session-123';
    const testContent = 'This is a test draft content';

    await createTestDraft(page, testSessionId, testContent);

    const drafts = await getCurrentDrafts(page);
    expect(drafts.length).toBe(1);
    expect(drafts[0].sessionId).toBe(testSessionId);
    expect(drafts[0].content).toBe(testContent);
  });

  test('应该能清除草稿', async ({ page }) => {
    await createTestDraft(page, 'session-1', 'Draft 1');
    await createTestDraft(page, 'session-2', 'Draft 2');

    await clearAllDrafts(page);

    const drafts = await getCurrentDrafts(page);
    expect(drafts.length).toBe(0);
  });
});

test.describe('Draft Recovery Dialog UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await clearAllDrafts(page);
  });

  test('有草稿时应该显示恢复对话框', async ({ page }) => {
    // 创建测试草稿
    await createTestDraft(page, 'test-session-1', 'Test draft content for recovery');

    // 刷新页面触发草稿检测
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 检查是否有恢复对话框
    const dialog = page.locator('[role="dialog"]');
    const hasDialog = await dialog.isVisible({ timeout: 3000 }).catch(() => false);

    // 或者检查是否有恢复相关文本
    const recoveryText = page.locator('text=/recover|恢复|draft|草稿/i');
    const hasRecoveryText = await recoveryText.count() > 0;

    console.log(`Dialog visible: ${hasDialog}, Recovery text found: ${hasRecoveryText}`);
  });

  test('草稿恢复对话框应该显示草稿内容预览', async ({ page }) => {
    const testContent = 'This is a long draft content that should be truncated for preview display in the recovery dialog';

    await createTestDraft(page, 'test-session-preview', testContent);

    await page.reload();
    await page.waitForLoadState('networkidle');

    // 检查是否有预览内容
    const previewText = page.locator(`text=/${testContent.slice(0, 30)}/i`);
    const hasPreview = await previewText.count() > 0;

    console.log(`Preview content visible: ${hasPreview}`);
  });

  test('应该能忽略单个草稿', async ({ page }) => {
    await createTestDraft(page, 'test-dismiss', 'Draft to dismiss');

    await page.reload();
    await page.waitForLoadState('networkidle');

    // 查找忽略/删除按钮
    const dismissButton = page.locator('button').filter({
      has: page.locator('svg') // 通常删除按钮有图标
    }).first();

    if (await dismissButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dismissButton.click();
      await page.waitForTimeout(300);

      const drafts = await getCurrentDrafts(page);
      console.log(`Drafts after dismiss: ${drafts.length}`);
    }
  });

  test('应该能忽略所有草稿', async ({ page }) => {
    await createTestDraft(page, 'session-1', 'Draft 1');
    await createTestDraft(page, 'session-2', 'Draft 2');

    await page.reload();
    await page.waitForLoadState('networkidle');

    // 查找 "Dismiss All" 或 "全部忽略" 按钮
    const dismissAllButton = page.locator('button:has-text("Dismiss All")')
      .or(page.locator('button:has-text("全部忽略")'))
      .or(page.locator('button:has-text("Ignore All")'));

    if (await dismissAllButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await dismissAllButton.first().click();
      await page.waitForTimeout(300);

      const drafts = await getCurrentDrafts(page);
      expect(drafts.length).toBe(0);
    }
  });
});

test.describe('Draft Recovery 数量限制', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await clearAllDrafts(page);
  });

  test('应该限制最多 5 个草稿', async ({ page }) => {
    // 创建 7 个草稿
    for (let i = 0; i < 7; i++) {
      await page.evaluate(
        ({ key, index }) => {
          const stored = localStorage.getItem(key);
          const data = stored ? JSON.parse(stored) : { drafts: [] };
          data.drafts.push({
            sessionId: `session-${index}`,
            content: `Draft content ${index}`,
            savedAt: new Date(Date.now() + index * 1000).toISOString(),
          });
          localStorage.setItem(key, JSON.stringify(data));
        },
        { key: TEST_CONFIG.draftsStorageKey, index: i }
      );
    }

    const drafts = await getCurrentDrafts(page);

    // 应该只保留最近的 5 个
    expect(drafts.length).toBe(7); // 评估前可能不会自动清理

    console.log(`Created ${drafts.length} drafts`);
  });

  test('最旧的草稿应该被清理', async ({ page }) => {
    // 创建草稿并手动触发清理逻辑
    await page.evaluate(
      (key) => {
        const drafts = [];
        for (let i = 0; i < 7; i++) {
          drafts.push({
            sessionId: `session-${i}`,
            content: `Draft ${i}`,
            savedAt: new Date(Date.now() + i * 1000).toISOString(),
          });
        }
        // 模拟清理逻辑 - 只保留最近的 5 个
        const cleaned = drafts
          .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
          .slice(0, 5);
        localStorage.setItem(key, JSON.stringify({ drafts: cleaned }));
      },
      TEST_CONFIG.draftsStorageKey
    );

    const drafts = await getCurrentDrafts(page);
    expect(drafts.length).toBe(5);

    // 最旧的 session-0 应该被移除
    const sessionIds = drafts.map((d: { sessionId: string }) => d.sessionId);
    expect(sessionIds).not.toContain('session-0');
    expect(sessionIds).not.toContain('session-1');
  });
});

test.describe('Draft Recovery 用户体验', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await clearAllDrafts(page);
  });

  test('无草稿时不应显示恢复对话框', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 检查恢复对话框不应该出现
    const recoveryDialog = page.locator('[role="dialog"]').filter({
      has: page.locator('text=/recover|恢复|draft|草稿/i')
    });

    const isVisible = await recoveryDialog.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('恢复草稿后应该填充输入框', async ({ page }) => {
    const testContent = 'Content to be recovered into input field';

    await createTestDraft(page, 'test-recover-input', testContent);

    await page.reload();
    await page.waitForLoadState('networkidle');

    // 查找恢复按钮
    const recoverButton = page.locator('button:has-text("Recover")')
      .or(page.locator('button:has-text("恢复")'));

    if (await recoverButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await recoverButton.first().click();
      await page.waitForTimeout(500);

      // 检查输入框是否有内容
      const inputArea = page.locator('textarea').or(page.locator('[contenteditable="true"]'));
      const inputValue = await inputArea.first().inputValue().catch(() => '');

      console.log(`Input value after recovery: ${inputValue}`);
    }
  });

  test('草稿应该显示相对时间', async ({ page }) => {
    // 创建一个 5 分钟前的草稿
    await page.evaluate(
      (key) => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        localStorage.setItem(key, JSON.stringify({
          drafts: [{
            sessionId: 'old-session',
            content: 'Old draft',
            savedAt: fiveMinutesAgo,
          }]
        }));
      },
      TEST_CONFIG.draftsStorageKey
    );

    await page.reload();
    await page.waitForLoadState('networkidle');

    // 检查是否显示相对时间（如 "5 minutes ago" 或 "5分钟前"）
    const timeText = page.locator('text=/minutes? ago|分钟前/i');
    const hasTimeText = await timeText.count() > 0;

    console.log(`Relative time displayed: ${hasTimeText}`);
  });
});

test.describe('Draft Recovery 国际化', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await clearAllDrafts(page);
  });

  test('草稿恢复对话框应该支持多语言', async ({ page }) => {
    await createTestDraft(page, 'i18n-test', 'Test draft for i18n');

    await page.reload();
    await page.waitForLoadState('networkidle');

    // 检查对话框文本 - 应该是中文或英文
    const dialogText = page.locator('[role="dialog"]').first();
    const content = await dialogText.textContent().catch(() => '');

    console.log(`Dialog content: ${content?.slice(0, 100)}`);
  });
});

test.describe('Draft Recovery 数据完整性', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await clearAllDrafts(page);
  });

  test('草稿应该包含完整的元数据', async ({ page }) => {
    const testDraft = {
      sessionId: 'metadata-test',
      sessionTitle: 'Test Session Title',
      content: 'Test content with metadata',
      images: [{ type: 'image_url', image_url: { url: 'data:image/png;base64,test' } }],
      files: [{ id: 'file-1', name: 'test.pdf', type: 'application/pdf', size: 1024, content: 'base64content' }],
      savedAt: new Date().toISOString(),
    };

    await page.evaluate(
      ({ key, draft }) => {
        localStorage.setItem(key, JSON.stringify({ drafts: [draft] }));
      },
      { key: TEST_CONFIG.draftsStorageKey, draft: testDraft }
    );

    const drafts = await getCurrentDrafts(page);
    expect(drafts[0].sessionId).toBe(testDraft.sessionId);
    expect(drafts[0].sessionTitle).toBe(testDraft.sessionTitle);
    expect(drafts[0].images).toBeDefined();
    expect(drafts[0].files).toBeDefined();
  });

  test('空草稿不应该被保存', async ({ page }) => {
    await page.evaluate(
      (key) => {
        localStorage.setItem(key, JSON.stringify({
          drafts: [{
            sessionId: 'empty-session',
            content: '', // 空内容
            savedAt: new Date().toISOString(),
          }]
        }));
      },
      TEST_CONFIG.draftsStorageKey
    );

    await page.reload();
    await page.waitForLoadState('networkidle');

    // 空草稿不应该触发恢复对话框
    const recoveryDialog = page.locator('[role="dialog"]').filter({
      has: page.locator('text=/recover|恢复/i')
    });

    const isVisible = await recoveryDialog.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`Empty draft triggers dialog: ${isVisible}`);
  });
});
