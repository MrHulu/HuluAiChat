/**
 * Search highlight utilities
 * 搜索高亮工具函数 - TASK-202
 */

/**
 * 高亮文本中的匹配项
 * @param text 原始文本
 * @param query 搜索词
 * @param caseSensitive 是否区分大小写
 * @returns 高亮后的 React 元素数组或原始字符串
 */
export function highlightMatches(
  text: string,
  query: string,
  caseSensitive: boolean = false
): (string | { type: "highlight"; text: string; key: string })[] {
  if (!query.trim()) {
    return [text];
  }

  const flags = caseSensitive ? "g" : "gi";
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, flags);

  const parts: (string | { type: "highlight"; text: string; key: string })[] = [];
  let lastIndex = 0;
  let matchIndex = 0;

  text.replace(regex, (match, _p1, offset) => {
    // Add text before match
    if (offset > lastIndex) {
      parts.push(text.slice(lastIndex, offset));
    }
    // Add highlighted match
    parts.push({
      type: "highlight",
      text: match,
      key: `hl-${matchIndex++}`,
    });
    lastIndex = offset + match.length;
    return match;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * 查找文本中的所有匹配位置
 * @param text 原始文本
 * @param query 搜索词
 * @param caseSensitive 是否区分大小写
 * @returns 匹配的起始位置数组
 */
export function findMatchPositions(
  text: string,
  query: string,
  caseSensitive: boolean = false
): number[] {
  if (!query.trim()) return [];

  const flags = caseSensitive ? "g" : "gi";
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedQuery, flags);

  const positions: number[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    positions.push(match.index);
  }

  return positions;
}

/**
 * 在消息列表中查找所有匹配的消息
 * @param messages 消息列表
 * @param query 搜索词
 * @param caseSensitive 是否区分大小写
 * @returns 匹配的消息 ID 数组
 */
export function findMatchingMessages(
  messages: { id: string; content: string }[],
  query: string,
  caseSensitive: boolean = false
): string[] {
  if (!query.trim()) return [];

  const flags = caseSensitive ? "" : "i";
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedQuery, flags);

  return messages
    .filter((msg) => regex.test(msg.content))
    .map((msg) => msg.id);
}

/**
 * 计算消息中匹配项的数量
 * @param text 消息内容
 * @param query 搜索词
 * @param caseSensitive 是否区分大小写
 * @returns 匹配数量
 */
export function countMatches(
  text: string,
  query: string,
  caseSensitive: boolean = false
): number {
  if (!query.trim()) return 0;

  const flags = caseSensitive ? "g" : "gi";
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedQuery, flags);

  const matches = text.match(regex);
  return matches ? matches.length : 0;
}
