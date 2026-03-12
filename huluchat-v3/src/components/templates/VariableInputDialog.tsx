/**
 * VariableInputDialog Component
 * 变量输入对话框 - 当模板包含变量时弹出
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Variable, Sparkles, Check } from "lucide-react";
import {
  getUserVariables,
  getVariableInfo,
  PREDEFINED_VARIABLES,
} from "@/utils/templateVariables";

interface VariableInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateContent: string;
  templateName?: string;
  onSubmit: (processedContent: string) => void;
}

export function VariableInputDialog({
  open,
  onOpenChange,
  templateContent,
  templateName,
  onSubmit,
}: VariableInputDialogProps) {
  const { t } = useTranslation();

  // 获取需要用户输入的变量
  const userVariables = useMemo(() => {
    return getUserVariables(templateContent, t);
  }, [templateContent, t]);

  // 获取预定义变量列表
  const predefinedVariables = useMemo(() => {
    const allVars = templateContent.match(/\{\{(\w+)\}\}/g) || [];
    const varNames = [...new Set(allVars.map(v => v.replace(/\{\{|\}\}/g, "")))];
    return varNames
      .filter(v => v in PREDEFINED_VARIABLES)
      .map(v => getVariableInfo(v, t));
  }, [templateContent, t]);

  // 用户输入的变量值
  const [values, setValues] = useState<Record<string, string>>({});

  // 重置值
  useEffect(() => {
    if (open) {
      const initialValues: Record<string, string> = {};
      userVariables.forEach((v) => {
        if (v.defaultValue) {
          initialValues[v.name] = v.defaultValue;
        }
      });
      setValues(initialValues);
    }
  }, [open, userVariables]);

  // 更新变量值
  const handleChange = useCallback((varName: string, value: string) => {
    setValues((prev) => ({ ...prev, [varName]: value }));
  }, []);

  // 提交
  const handleSubmit = useCallback(() => {
    // 构建最终内容
    let processedContent = templateContent;

    // 替换预定义变量
    for (const [name, fn] of Object.entries(PREDEFINED_VARIABLES)) {
      const regex = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
      processedContent = processedContent.replace(regex, fn());
    }

    // 替换用户变量
    for (const [name, value] of Object.entries(values)) {
      const regex = new RegExp(`\\{\\{${name}\\}\\}`, 'g');
      processedContent = processedContent.replace(regex, value);
    }

    onSubmit(processedContent);
    onOpenChange(false);
  }, [templateContent, values, onSubmit, onOpenChange]);

  // 检查所有必填变量是否已填写
  const isValid = useMemo(() => {
    return userVariables.every((v) => values[v.name]?.trim());
  }, [userVariables, values]);

  // 没有需要用户输入的变量时，直接提交
  useEffect(() => {
    if (open && userVariables.length === 0) {
      handleSubmit();
    }
  }, [open, userVariables.length, handleSubmit]);

  // 如果没有用户变量，不渲染对话框
  if (userVariables.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Variable className="w-5 h-5 text-primary" />
            {t("variables.dialogTitle")}
          </DialogTitle>
          <DialogDescription>
            {templateName
              ? t("variables.dialogDescriptionWithTemplate", { template: templateName })
              : t("variables.dialogDescription")}
          </DialogDescription>
        </DialogHeader>

        {/* 预定义变量提示 */}
        {predefinedVariables.length > 0 && (
          <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              {t("variables.autoFilledVariables")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {predefinedVariables.map((v) => (
                <span
                  key={v.name}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary dark:bg-primary/20"
                >
                  <Check className="w-3 h-3" />
                  {`{{${v.name}}}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 用户需要填写的变量 */}
        <div className="space-y-4">
          {userVariables.map((variable) => (
            <div key={variable.name} className="space-y-1.5">
              <label
                htmlFor={`var-${variable.name}`}
                className="text-sm font-medium flex items-center gap-1.5"
              >
                <span className="text-primary font-mono text-xs">{`{{${variable.name}}}`}</span>
                <span className="text-muted-foreground">-</span>
                <span>{variable.label}</span>
              </label>
              <input
                id={`var-${variable.name}`}
                type="text"
                value={values[variable.name] || ""}
                onChange={(e) => handleChange(variable.name, e.target.value)}
                placeholder={variable.placeholder || t("variables.enterValue")}
                className={cn(
                  "w-full rounded-md border border-input bg-background",
                  "px-3 py-2 text-sm",
                  "placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  "transition-all duration-200"
                )}
                autoFocus={userVariables[0]?.name === variable.name}
              />
            </div>
          ))}
        </div>

        {/* 预览 */}
        <div className="mt-4 p-3 bg-muted/30 dark:bg-muted/20 rounded-lg border border-border">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            {t("variables.preview")}
          </div>
          <div className="text-sm whitespace-pre-wrap line-clamp-3">
            {templateContent.substring(0, 200)}
            {templateContent.length > 200 && "..."}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            {t("variables.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
