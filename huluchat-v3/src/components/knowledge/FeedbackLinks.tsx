/**
 * FeedbackLinks - 反馈入口组件
 * 提供 GitHub Issues 和邮件联系入口
 */
import { useTranslation } from "react-i18next";
import { ExternalLink, Mail, Github, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackLinksProps {
  className?: string;
}

// 反馈链接配置
const FEEDBACK_LINKS = [
  {
    id: "github",
    icon: Github,
    titleKey: "knowledge.feedback.github.title",
    descriptionKey: "knowledge.feedback.github.description",
    href: "https://github.com/MrHulu/HuluAiChat/issues",
    external: true,
  },
  {
    id: "email",
    icon: Mail,
    titleKey: "knowledge.feedback.email.title",
    descriptionKey: "knowledge.feedback.email.description",
    href: "mailto:491849417@qq.com",
    external: false,
  },
  {
    id: "community",
    icon: MessageCircle,
    titleKey: "knowledge.feedback.community.title",
    descriptionKey: "knowledge.feedback.community.description",
    href: "https://github.com/MrHulu/HuluAiChat/discussions",
    external: true,
  },
];

export function FeedbackLinks({ className }: FeedbackLinksProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("space-y-3", className)}>
      {/* 标题 */}
      <h3 className="text-sm font-medium text-muted-foreground px-1">
        {t("knowledge.feedback.title")}
      </h3>

      {/* 链接列表 */}
      <div className="space-y-2">
        {FEEDBACK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.id}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg",
                "bg-muted/30 hover:bg-muted/50",
                "transition-all duration-200",
                "dark:bg-muted/20 dark:hover:bg-muted/30",
                "group cursor-pointer"
              )}
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm">{t(link.titleKey)}</span>
                  {link.external && (
                    <ExternalLink className="size-3 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(link.descriptionKey)}
                </p>
              </div>
            </a>
          );
        })}
      </div>

      {/* 隐私提示 */}
      <p className="text-xs text-muted-foreground text-center pt-2 px-2">
        {t("knowledge.feedback.privacyNote")}
      </p>
    </div>
  );
}
