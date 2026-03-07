/**
 * Export Chat Plugin
 * Export conversations to Markdown or JSON
 */

export default {
  /**
   * @param {import('../../src/plugins/types').PluginContext} context
   */
  async activate(context) {
    console.log(`[ExportChat] Plugin activated`);

    /**
     * Format messages as Markdown
     * @param {Array} messages
     * @param {string} title
     */
    function formatAsMarkdown(messages, title = 'Chat Export') {
      let md = `# ${title}\n\n`;
      md += `*Exported from HuluChat on ${new Date().toLocaleString()}*\n\n`;
      md += `---\n\n`;

      for (const msg of messages) {
        const role = msg.role === 'user' ? '👤 **You**' : '🤖 **Assistant**';
        const time = msg.timestamp ? ` *(${new Date(msg.timestamp).toLocaleTimeString()})*` : '';
        md += `${role}${time}\n\n`;
        md += `${msg.content}\n\n`;
        md += `---\n\n`;
      }

      return md;
    }

    /**
     * Format messages as JSON
     * @param {Array} messages
     */
    function formatAsJSON(messages) {
      return JSON.stringify({
        exportedAt: new Date().toISOString(),
        source: 'HuluChat',
        messageCount: messages.length,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp || null
        }))
      }, null, 2);
    }

    /**
     * Download text as file
     * @param {string} content
     * @param {string} filename
     * @param {string} mimeType
     */
    function downloadFile(content, filename, mimeType) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // Register command: Export as Markdown
    context.registerCommand({
      id: 'exportChat.exportMarkdown',
      title: 'Export Current Chat as Markdown',
      handler: async () => {
        try {
          const messages = context.storage.get('currentMessages') || [];
          if (messages.length === 0) {
            context.showNotification('No messages to export', 'warning');
            return;
          }

          const markdown = formatAsMarkdown(messages);
          const timestamp = new Date().toISOString().slice(0, 10);
          downloadFile(markdown, `huluchat-export-${timestamp}.md`, 'text/markdown');

          context.showNotification(`Exported ${messages.length} messages as Markdown`, 'success');
        } catch (error) {
          context.showNotification('Failed to export chat', 'error');
          console.error('[ExportChat] Error:', error);
        }
      }
    });

    // Register command: Export as JSON
    context.registerCommand({
      id: 'exportChat.exportJSON',
      title: 'Export Current Chat as JSON',
      handler: async () => {
        try {
          const messages = context.storage.get('currentMessages') || [];
          if (messages.length === 0) {
            context.showNotification('No messages to export', 'warning');
            return;
          }

          const json = formatAsJSON(messages);
          const timestamp = new Date().toISOString().slice(0, 10);
          downloadFile(json, `huluchat-export-${timestamp}.json`, 'application/json');

          context.showNotification(`Exported ${messages.length} messages as JSON`, 'success');
        } catch (error) {
          context.showNotification('Failed to export chat', 'error');
          console.error('[ExportChat] Error:', error);
        }
      }
    });

    // Register command: Copy as Markdown
    context.registerCommand({
      id: 'exportChat.copyAsMarkdown',
      title: 'Copy Current Chat as Markdown',
      handler: async () => {
        try {
          const messages = context.storage.get('currentMessages') || [];
          if (messages.length === 0) {
            context.showNotification('No messages to copy', 'warning');
            return;
          }

          const markdown = formatAsMarkdown(messages);

          // Use clipboard API
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(markdown);
            context.showNotification(`Copied ${messages.length} messages to clipboard`, 'success');
          } else {
            context.showNotification('Clipboard not available', 'error');
          }
        } catch (error) {
          context.showNotification('Failed to copy chat', 'error');
          console.error('[ExportChat] Error:', error);
        }
      }
    });

    // Track current conversation messages
    const beforeSendDisposable = context.onBeforeSend((message) => {
      const messages = context.storage.get('currentMessages') || [];
      messages.push({
        role: 'user',
        content: message.content,
        timestamp: Date.now()
      });
      context.storage.set('currentMessages', messages);
      return message;
    });

    const afterReceiveDisposable = context.onAfterReceive((message) => {
      if (message.role === 'assistant') {
        const messages = context.storage.get('currentMessages') || [];
        messages.push({
          role: 'assistant',
          content: message.content,
          timestamp: Date.now()
        });
        context.storage.set('currentMessages', messages);
      }
      return message;
    });

    // Cleanup
    context.onDispose(() => {
      console.log('[ExportChat] Cleaning up...');
      beforeSendDisposable.dispose();
      afterReceiveDisposable.dispose();
    });
  },

  async deactivate() {
    console.log('[ExportChat] Plugin deactivated');
  }
};
