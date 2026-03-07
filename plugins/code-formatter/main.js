/**
 * Code Formatter Plugin
 * Format and beautify code blocks in your messages
 */

export default {
  /**
   * @param {import('../../src/plugins/types').PluginContext} context
   */
  async activate(context) {
    console.log(`[CodeFormatter] Plugin activated`);

    // Store recent messages with code
    let lastCodeBlocks = [];

    /**
     * Extract code blocks from text
     * @param {string} text
     */
    function extractCodeBlocks(text) {
      const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
      const blocks = [];
      let match;

      while ((match = codeBlockRegex.exec(text)) !== null) {
        blocks.push({
          language: match[1] || 'text',
          code: match[2].trim()
        });
      }

      return blocks;
    }

    /**
     * Format JSON string
     * @param {string} jsonStr
     */
    function formatJSON(jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        return null;
      }
    }

    /**
     * Minify JSON string
     * @param {string} jsonStr
     */
    function minifyJSON(jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        return JSON.stringify(parsed);
      } catch (e) {
        return null;
      }
    }

    /**
     * Basic code indentation fix
     * @param {string} code
     * @param {string} language
     */
    function formatCode(code, language) {
      const lines = code.split('\n');

      // Remove empty lines at start and end
      while (lines.length > 0 && lines[0].trim() === '') lines.shift();
      while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();

      // Find minimum indentation
      let minIndent = Infinity;
      for (const line of lines) {
        if (line.trim().length > 0) {
          const indent = line.match(/^(\s*)/)[1].length;
          minIndent = Math.min(minIndent, indent);
        }
      }

      // Remove common indentation
      if (minIndent > 0 && minIndent !== Infinity) {
        for (let i = 0; i < lines.length; i++) {
          lines[i] = lines[i].substring(minIndent);
        }
      }

      return lines.join('\n');
    }

    // Register command: Format JSON
    context.registerCommand({
      id: 'codeFormatter.formatJSON',
      title: 'Format JSON',
      handler: async () => {
        try {
          // Try clipboard first
          let input = '';
          if (context.clipboard) {
            input = await context.clipboard.readText();
          }

          // If no clipboard or not JSON, try last code block
          if (!input || !input.trim().startsWith('{') && !input.trim().startsWith('[')) {
            const jsonBlock = lastCodeBlocks.find(b =>
              b.language === 'json' || b.code.trim().startsWith('{') || b.code.trim().startsWith('[')
            );
            if (jsonBlock) {
              input = jsonBlock.code;
            }
          }

          if (!input) {
            context.showNotification('No JSON found. Copy JSON to clipboard first.', 'info');
            return;
          }

          const formatted = formatJSON(input);
          if (formatted === null) {
            context.showNotification('Invalid JSON format', 'error');
            return;
          }

          if (context.clipboard) {
            await context.clipboard.writeText(formatted);
            context.showNotification(
              `Formatted JSON (${formatted.split('\n').length} lines). Copied to clipboard.`,
              'success'
            );
          } else {
            console.log('[CodeFormatter] Formatted JSON:\n' + formatted);
            context.showNotification('JSON formatted. Check console.', 'info');
          }
        } catch (error) {
          context.showNotification('Failed to format JSON', 'error');
          console.error('[CodeFormatter] Error:', error);
        }
      }
    });

    // Register command: Minify JSON
    context.registerCommand({
      id: 'codeFormatter.minifyJSON',
      title: 'Minify JSON',
      handler: async () => {
        try {
          let input = '';
          if (context.clipboard) {
            input = await context.clipboard.readText();
          }

          if (!input) {
            context.showNotification('Copy JSON to clipboard first', 'info');
            return;
          }

          const minified = minifyJSON(input);
          if (minified === null) {
            context.showNotification('Invalid JSON format', 'error');
            return;
          }

          if (context.clipboard) {
            await context.clipboard.writeText(minified);
            context.showNotification(
              `Minified JSON (${minified.length} chars). Copied to clipboard.`,
              'success'
            );
          }
        } catch (error) {
          context.showNotification('Failed to minify JSON', 'error');
          console.error('[CodeFormatter] Error:', error);
        }
      }
    });

    // Register command: Format Code
    context.registerCommand({
      id: 'codeFormatter.formatCode',
      title: 'Format Code Block',
      handler: async () => {
        try {
          let input = '';
          if (context.clipboard) {
            input = await context.clipboard.readText();
          }

          if (!input && lastCodeBlocks.length > 0) {
            input = lastCodeBlocks[lastCodeBlocks.length - 1].code;
          }

          if (!input) {
            context.showNotification('No code found to format', 'info');
            return;
          }

          const formatted = formatCode(input, 'text');

          if (context.clipboard) {
            await context.clipboard.writeText(formatted);
            context.showNotification(
              'Code formatted. Copied to clipboard.',
              'success'
            );
          }
        } catch (error) {
          context.showNotification('Failed to format code', 'error');
          console.error('[CodeFormatter] Error:', error);
        }
      }
    });

    // Register command: Extract Code
    context.registerCommand({
      id: 'codeFormatter.extractCode',
      title: 'Extract Last Code Block',
      handler: async () => {
        try {
          if (lastCodeBlocks.length === 0) {
            context.showNotification('No code blocks found in recent messages', 'info');
            return;
          }

          const lastBlock = lastCodeBlocks[lastCodeBlocks.length - 1];
          const codeWithLang = `\`\`\`${lastBlock.language}\n${lastBlock.code}\n\`\`\``;

          if (context.clipboard) {
            await context.clipboard.writeText(codeWithLang);
            context.showNotification(
              `Extracted ${lastBlock.language} code (${lastBlock.code.split('\n').length} lines). Copied!`,
              'success'
            );
          } else {
            console.log('[CodeFormatter] Extracted code:\n' + codeWithLang);
            context.showNotification('Code extracted. Check console.', 'info');
          }
        } catch (error) {
          context.showNotification('Failed to extract code', 'error');
          console.error('[CodeFormatter] Error:', error);
        }
      }
    });

    // Track messages to extract code blocks
    const afterReceiveDisposable = context.onAfterReceive((message) => {
      if (message.role === 'assistant') {
        const blocks = extractCodeBlocks(message.content);
        if (blocks.length > 0) {
          lastCodeBlocks = blocks;
          console.log(`[CodeFormatter] Found ${blocks.length} code block(s) in AI response`);
        }
      }
      return message;
    });

    // Cleanup
    context.onDispose(() => {
      console.log('[CodeFormatter] Cleaning up...');
      afterReceiveDisposable.dispose();
    });
  },

  async deactivate() {
    console.log('[CodeFormatter] Plugin deactivated');
  }
};
