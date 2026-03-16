/**
 * UnsavedContentDialog Component
 * TASK-351: 输入内容丢失警告
 * 当用户尝试切换会话或关闭应用时，显示确认对话框
 */
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface UnsavedContentDialogProps {
  /** 是否显示对话框 */
  open: boolean;
  /** 关闭对话框（取消操作） */
  onOpenChange: (open: boolean) => void;
  /** 确认继续（丢弃未保存内容） */
  onConfirm: () => void;
}

export function UnsavedContentDialog({
  open,
  onOpenChange,
  onConfirm,
}: UnsavedContentDialogProps) {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            {t("unsavedContent.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("unsavedContent.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {t("unsavedContent.discard")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
