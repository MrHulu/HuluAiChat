/**
 * 提示词技巧数据
 * 包含核心提示词使用技巧
 */

export type TipLevel = "beginner" | "intermediate" | "advanced";

export interface PromptTip {
  id: string;
  icon: string;
  titleKey: string;
  descriptionKey: string;
  contentKey: string;
  level: TipLevel;
  readTime: number; // 分钟
  tags: string[];
}

export const PROMPT_TIPS: PromptTip[] = [
  {
    id: "clear-instructions",
    icon: "🎯",
    titleKey: "knowledge.tips.clearInstructions.title",
    descriptionKey: "knowledge.tips.clearInstructions.description",
    contentKey: "knowledge.tips.clearInstructions.content",
    level: "beginner",
    readTime: 3,
    tags: ["basics", "clarity"],
  },
  {
    id: "role-prompting",
    icon: "🎭",
    titleKey: "knowledge.tips.rolePrompting.title",
    descriptionKey: "knowledge.tips.rolePrompting.description",
    contentKey: "knowledge.tips.rolePrompting.content",
    level: "beginner",
    readTime: 4,
    tags: ["basics", "context"],
  },
  {
    id: "chain-of-thought",
    icon: "🧠",
    titleKey: "knowledge.tips.chainOfThought.title",
    descriptionKey: "knowledge.tips.chainOfThought.description",
    contentKey: "knowledge.tips.chainOfThought.content",
    level: "intermediate",
    readTime: 5,
    tags: ["reasoning", "complex"],
  },
  {
    id: "few-shot-examples",
    icon: "📚",
    titleKey: "knowledge.tips.fewShotExamples.title",
    descriptionKey: "knowledge.tips.fewShotExamples.description",
    contentKey: "knowledge.tips.fewShotExamples.content",
    level: "intermediate",
    readTime: 4,
    tags: ["examples", "learning"],
  },
  {
    id: "iterative-refinement",
    icon: "🔄",
    titleKey: "knowledge.tips.iterativeRefinement.title",
    descriptionKey: "knowledge.tips.iterativeRefinement.description",
    contentKey: "knowledge.tips.iterativeRefinement.content",
    level: "intermediate",
    readTime: 4,
    tags: ["workflow", "quality"],
  },
  {
    id: "structured-output",
    icon: "📋",
    titleKey: "knowledge.tips.structuredOutput.title",
    descriptionKey: "knowledge.tips.structuredOutput.description",
    contentKey: "knowledge.tips.structuredOutput.content",
    level: "intermediate",
    readTime: 3,
    tags: ["format", "output"],
  },
  {
    id: "context-management",
    icon: "🗂️",
    titleKey: "knowledge.tips.contextManagement.title",
    descriptionKey: "knowledge.tips.contextManagement.description",
    contentKey: "knowledge.tips.contextManagement.content",
    level: "advanced",
    readTime: 5,
    tags: ["context", "optimization"],
  },
  {
    id: "prompt-templates",
    icon: "📝",
    titleKey: "knowledge.tips.promptTemplates.title",
    descriptionKey: "knowledge.tips.promptTemplates.description",
    contentKey: "knowledge.tips.promptTemplates.content",
    level: "advanced",
    readTime: 4,
    tags: ["templates", "efficiency"],
  },
];
