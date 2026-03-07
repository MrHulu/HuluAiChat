/**
 * Sample Hello Plugin
 * Demonstrates the HuluChat plugin API
 */

export default {
  /**
   * Called when the plugin is activated
   * @param {import('../../src/plugins/types').PluginContext} context
   */
  async activate(context) {
    console.log(`[SampleHello] Plugin activated: ${context.id} v${context.version}`);

    // Store activation count
    const activationCount = context.storage.get('activationCount') || 0;
    context.storage.set('activationCount', activationCount + 1);
    console.log(`[SampleHello] Activation count: ${activationCount + 1}`);

    // Register command: Show Session Stats
    context.registerCommand({
      id: 'sampleHello.showStats',
      title: 'Show Session Stats',
      handler: async () => {
        try {
          const sessions = await context.api.getSessions();
          const stats = {
            totalSessions: sessions.length,
            activationCount: context.storage.get('activationCount') || 0,
          };

          context.showNotification(
            `You have ${stats.totalSessions} chat sessions!`,
            'info'
          );

          console.log('[SampleHello] Session stats:', stats);
        } catch (error) {
          context.showNotification('Failed to get session stats', 'error');
          console.error('[SampleHello] Error:', error);
        }
      }
    });

    // Register command: Insert Timestamp
    context.registerCommand({
      id: 'sampleHello.insertTimestamp',
      title: 'Insert Timestamp',
      handler: () => {
        const now = new Date();
        const timestamp = now.toLocaleString();
        context.showNotification(`Current time: ${timestamp}`, 'info');
      }
    });

    // Register message hook: Log all messages
    const beforeSendDisposable = context.onBeforeSend((message) => {
      console.log('[SampleHello] Message being sent:', message.content.substring(0, 50));
      // Return message unchanged (no transformation)
      return message;
    });

    const afterReceiveDisposable = context.onAfterReceive((message) => {
      if (message.role === 'assistant') {
        console.log('[SampleHello] Response received:', message.content.substring(0, 50));
      }
      return message;
    });

    // Register cleanup
    context.onDispose(() => {
      console.log('[SampleHello] Cleaning up...');
      beforeSendDisposable.dispose();
      afterReceiveDisposable.dispose();
    });
  },

  /**
   * Called when the plugin is deactivated
   */
  async deactivate() {
    console.log('[SampleHello] Plugin deactivated');
  }
};
