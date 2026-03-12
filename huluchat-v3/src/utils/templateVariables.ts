/**
 * Template Variables System
 * 提示词模板变量系统
 *
 * 支持在模板中使用 {{variable_name}} 格式的变量
 * 用户选择带变量的模板时，会弹出对话框填写变量值
 */

/**
 * 预定义变量 - 这些变量会自动填充，无需用户输入
 */
export const PREDEFINED_VARIABLES: Record<string, () => string> = {
  date: () => new Date().toLocaleDateString(),
  time: () => new Date().toLocaleTimeString(),
  datetime: () => new Date().toLocaleString(),
  weekday: () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  },
  year: () => new Date().getFullYear().toString(),
  month: () => (new Date().getMonth() + 1).toString(),
  day: () => new Date().getDate().toString(),
  timestamp: () => Date.now().toString(),
};

/**
 * 变量定义接口
 */
export interface TemplateVariable {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  isPredefined: boolean;
}

/**
 * 从模板内容中提取变量
 * @param content 模板内容
 * @returns 变量名数组
 */
export function extractVariables(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const varName = match[1];
    if (!variables.includes(varName)) {
      variables.push(varName);
    }
  }

  return variables;
}

/**
 * 获取变量信息
 * @param varName 变量名
 * @param t i18n 翻译函数
 * @returns 变量定义
 */
export function getVariableInfo(varName: string, t?: (key: string) => string): TemplateVariable {
  const isPredefined = varName in PREDEFINED_VARIABLES;

  // 尝试获取翻译后的标签
  const labelKey = `variables.${varName}`;
  const label = t ? (t(labelKey) !== labelKey ? t(labelKey) : varName) : varName;

  const placeholderKey = `variables.${varName}Placeholder`;
  const placeholder = t ? (t(placeholderKey) !== placeholderKey ? t(placeholderKey) : undefined) : undefined;

  return {
    name: varName,
    label,
    placeholder,
    isPredefined,
  };
}

/**
 * 替换模板中的变量为实际值
 * @param content 模板内容
 * @param values 变量值映射
 * @returns 替换后的内容
 */
export function replaceVariables(
  content: string,
  values: Record<string, string>
): string {
  let result = content;

  // 首先替换预定义变量
  for (const [name, fn] of Object.entries(PREDEFINED_VARIABLES)) {
    const regex = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
    result = result.replace(regex, fn());
  }

  // 然后替换用户提供的变量值
  for (const [name, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
  }

  return result;
}

/**
 * 检查模板是否包含需要用户输入的变量
 * @param content 模板内容
 * @returns 是否需要用户输入
 */
export function hasUserVariables(content: string): boolean {
  const variables = extractVariables(content);
  return variables.some(v => !(v in PREDEFINED_VARIABLES));
}

/**
 * 获取需要用户输入的变量列表
 * @param content 模板内容
 * @param t i18n 翻译函数
 * @returns 需要用户输入的变量列表
 */
export function getUserVariables(content: string, t?: (key: string) => string): TemplateVariable[] {
  const variables = extractVariables(content);
  return variables
    .filter(v => !(v in PREDEFINED_VARIABLES))
    .map(v => getVariableInfo(v, t));
}

/**
 * 获取预定义变量的值
 * @param varName 变量名
 * @returns 变量值，如果不是预定义变量则返回 undefined
 */
export function getPredefinedValue(varName: string): string | undefined {
  if (varName in PREDEFINED_VARIABLES) {
    return PREDEFINED_VARIABLES[varName]();
  }
  return undefined;
}

/**
 * 处理模板内容 - 替换所有变量
 * @param content 模板内容
 * @param userValues 用户提供的变量值
 * @returns 处理后的内容
 */
export function processTemplate(
  content: string,
  userValues: Record<string, string> = {}
): string {
  return replaceVariables(content, userValues);
}
