/**
 * Quick Reply Plugin
 * Manage and use quick reply templates for common responses
 */

export default {
  /**
   * @param {import('../../src/plugins/types').PluginContext} context
   */
  async activate(context) {
    console.log(`[QuickReply] Plugin activated`);

    // Default templates
    const defaultTemplates = [
      { id: '1', name: 'Thank You', content: 'Thank you for your help! I appreciate it.' },
      { id: '2', name: 'Got It', content: 'Got it, thanks for the clarification.' },
      { id: '3', name: 'Will Try', content: 'I will try that and get back to you.' },
      { id: '4', name: 'More Details', content: 'Could you please provide more details about this?' },
      { id: '5', name: 'Follow Up', content: 'Following up on our previous conversation...' },
    ];

    // Initialize templates if not exists
    if (!context.storage.get('templates')) {
      context.storage.set('templates', defaultTemplates);
      console.log('[QuickReply] Initialized default templates');
    }

    /**
     * Get all templates
     */
    function getTemplates() {
      return context.storage.get('templates') || [];
    }

    /**
     * Save templates
     */
    function saveTemplates(templates) {
      context.storage.set('templates', templates);
    }

    /**
     * Generate unique ID
     */
    function generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Register command: Add Template
    context.registerCommand({
      id: 'quickReply.addTemplate',
      title: 'Add Quick Reply Template',
      handler: async () => {
        try {
          // Get clipboard content as template content
          const clipboardText = await context.clipboard?.readText() || '';

          const name = `Template ${getTemplates().length + 1}`;
          const content = clipboardText || 'Your quick reply text here...';

          const templates = getTemplates();
          templates.push({
            id: generateId(),
            name,
            content
          });
          saveTemplates(templates);

          context.showNotification(
            `Added template: "${name}"`,
            'success'
          );
          console.log(`[QuickReply] Added template: ${name}`);
        } catch (error) {
          context.showNotification('Failed to add template', 'error');
          console.error('[QuickReply] Error:', error);
        }
      }
    });

    // Register command: List Templates
    context.registerCommand({
      id: 'quickReply.listTemplates',
      title: 'List All Templates',
      handler: () => {
        const templates = getTemplates();
        if (templates.length === 0) {
          context.showNotification('No templates saved yet', 'info');
          return;
        }

        const list = templates
          .map((t, i) => `${i + 1}. ${t.name}`)
          .join('\n');

        console.log('[QuickReply] Templates:\n' + list);
        context.showNotification(
          `${templates.length} templates available. Check console for list.`,
          'info'
        );
      }
    });

    // Register command: Insert Template
    context.registerCommand({
      id: 'quickReply.insertTemplate',
      title: 'Insert Template to Input',
      handler: async () => {
        try {
          const templates = getTemplates();
          if (templates.length === 0) {
            context.showNotification('No templates saved. Add one first!', 'info');
            return;
          }

          // Use first template as default (in future, could show picker)
          const template = templates[0];

          // Copy to clipboard as a workaround
          if (context.clipboard) {
            await context.clipboard.writeText(template.content);
            context.showNotification(
              `Copied "${template.name}" to clipboard. Paste to use.`,
              'success'
            );
          } else {
            console.log(`[QuickReply] Template content: ${template.content}`);
            context.showNotification(
              `Template: ${template.content.substring(0, 50)}...`,
              'info'
            );
          }
        } catch (error) {
          context.showNotification('Failed to insert template', 'error');
          console.error('[QuickReply] Error:', error);
        }
      }
    });

    // Register command: Clear Templates
    context.registerCommand({
      id: 'quickReply.clearTemplates',
      title: 'Clear All Templates',
      handler: () => {
        const count = getTemplates().length;
        if (count === 0) {
          context.showNotification('No templates to clear', 'info');
          return;
        }

        saveTemplates([]);
        context.showNotification(
          `Cleared ${count} templates`,
          'success'
        );
        console.log(`[QuickReply] Cleared ${count} templates`);
      }
    });

    // Register message hook: Auto-expand template variables
    const beforeSendDisposable = context.onBeforeSend((message) => {
      // Check for template pattern: {{template:name}}
      const templatePattern = /\{\{template:([^}]+)\}\}/g;
      let modified = false;
      const templates = getTemplates();

      const newContent = message.content.replace(templatePattern, (match, templateName) => {
        const template = templates.find(t =>
          t.name.toLowerCase() === templateName.toLowerCase()
        );
        if (template) {
          modified = true;
          return template.content;
        }
        return match; // Keep original if not found
      });

      if (modified) {
        console.log(`[QuickReply] Expanded template variables in message`);
        return { ...message, content: newContent };
      }
      return message;
    });

    // Cleanup
    context.onDispose(() => {
      console.log('[QuickReply] Cleaning up...');
      beforeSendDisposable.dispose();
    });
  },

  async deactivate() {
    console.log('[QuickReply] Plugin deactivated');
  }
};
