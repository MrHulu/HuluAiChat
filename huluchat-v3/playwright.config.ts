import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 测试配置
 * 用于 HuluChat 真实场景集成测试
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // 串行执行避免并发问题
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // CI 环境只重试 1 次
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 90000, // 全局超时 90 秒
  expect: {
    timeout: 10000, // expect 超时 10 秒
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000, // 操作超时 30 秒
    navigationTimeout: 60000, // 导航超时 60 秒
    viewport: { width: 1280, height: 720 },
    // 忽略 HTTPS 错误
    ignoreHTTPSErrors: true,
    // 更宽松的等待策略
    launchOptions: {
      args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 开发服务器配置 - 使用 Vite 开发服务器 (端口 5173)
  webServer: {
    command: 'npm run dev -- --port 5173 --host localhost',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
