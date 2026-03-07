/**
 * Word Count Plugin
 * Count words and characters in messages
 */

export default {
  /**
   * @param {import('../../src/plugins/types').PluginContext} context
   */
  async activate(context) {
    console.log(`[WordCount] Plugin activated`);

    // Track total stats
    let totalWords = context.storage.get('totalWords') || 0;
    let totalChars = context.storage.get('totalChars') || 0;

    /**
     * Count words in text
     * @param {string} text
     */
    function countWords(text) {
      if (!text) return { words: 0, chars: 0, charsNoSpaces: 0 };

      const chars = text.length;
      const charsNoSpaces = text.replace(/\s/g, '').length;

      // Handle CJK characters (each character is a word)
      const cjkChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length;

      // Count non-CJK words
      const nonCjkText = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, ' ');
      const words = nonCjkText.trim().split(/\s+/).filter(w => w.length > 0).length;

      return {
        words: cjkChars + words,
        chars,
        charsNoSpaces
      };
    }

    /**
     * Format stats for display
     */
    function formatStats(count) {
      return `${count.words} words, ${count.chars} chars (${count.charsNoSpaces} no spaces)`;
    }

    // Register command: Count Last Message
    context.registerCommand({
      id: 'wordCount.countLastMessage',
      title: 'Count Words in Last Message',
      handler: async () => {
        try {
          const messages = context.storage.get('lastMessages') || [];
          if (messages.length === 0) {
            context.showNotification('No messages to count', 'info');
            return;
          }

          const lastMessage = messages[messages.length - 1];
          const count = countWords(lastMessage.content);
          context.showNotification(
            `Last message: ${formatStats(count)}`,
            'info'
          );
        } catch (error) {
          context.showNotification('Failed to count words', 'error');
          console.error('[WordCount] Error:', error);
        }
      }
    });

    // Register command: Show Total Stats
    context.registerCommand({
      id: 'wordCount.showTotalStats',
      title: 'Show Total Chat Stats',
      handler: () => {
        const savedWords = context.storage.get('totalWords') || 0;
        const savedChars = context.storage.get('totalChars') || 0;
        const messageCount = context.storage.get('messageCount') || 0;

        context.showNotification(
          `Total: ${savedWords} words, ${savedChars} chars across ${messageCount} messages`,
          'info'
        );
      }
    });

    // Register command: Count Selection (placeholder - needs UI support)
    context.registerCommand({
      id: 'wordCount.countSelection',
      title: 'Count Words in Selection',
      handler: () => {
        context.showNotification(
          'Select text in the chat and this command will count it',
          'info'
        );
      }
    });

    // Track messages
    const beforeSendDisposable = context.onBeforeSend((message) => {
      const count = countWords(message.content);
      totalWords += count.words;
      totalChars += count.chars;

      const messageCount = (context.storage.get('messageCount') || 0) + 1;
      context.storage.set('totalWords', totalWords);
      context.storage.set('totalChars', totalChars);
      context.storage.set('messageCount', messageCount);

      // Store recent messages
      const messages = context.storage.get('lastMessages') || [];
      messages.push({ role: 'user', content: message.content });
      if (messages.length > 100) messages.shift();
      context.storage.set('lastMessages', messages);

      console.log(`[WordCount] User message: ${formatStats(count)}`);
      return message;
    });

    const afterReceiveDisposable = context.onAfterReceive((message) => {
      if (message.role === 'assistant') {
        const count = countWords(message.content);
        totalWords += count.words;
        totalChars += count.chars;

        context.storage.set('totalWords', totalWords);
        context.storage.set('totalChars', totalChars);

        // Store AI responses
        const messages = context.storage.get('lastMessages') || [];
        messages.push({ role: 'assistant', content: message.content });
        if (messages.length > 100) messages.shift();
        context.storage.set('lastMessages', messages);

        console.log(`[WordCount] AI response: ${formatStats(count)}`);
      }
      return message;
    });

    // Cleanup
    context.onDispose(() => {
      console.log('[WordCount] Cleaning up...');
      beforeSendDisposable.dispose();
      afterReceiveDisposable.dispose();
    });
  },

  async deactivate() {
    console.log('[WordCount] Plugin deactivated');
  }
};
