/**
 * FAQList - FAQ 常见问题列表组件
 * 使用 Accordion 组件展示分类 FAQ
 */
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
  FAQ_CATEGORIES,
  getFAQGroupedByCategory,
} from "@/data/faqData";

interface FAQListProps {
  className?: string;
}

export function FAQList({ className }: FAQListProps) {
  const { t } = useTranslation();

  const groupedFAQ = useMemo(() => getFAQGroupedByCategory(), []);

  return (
    <div className={cn("space-y-6", className)}>
      {FAQ_CATEGORIES.map((category) => {
        const items = groupedFAQ[category.id];
        if (items.length === 0) return null;

        return (
          <div key={category.id} className="space-y-2">
            {/* 分类标题 */}
            <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground px-1">
              <span className="text-base">{category.icon}</span>
              {t(category.titleKey)}
            </h3>

            {/* 该分类的 FAQ 项目 */}
            <Accordion type="single" className="space-y-2">
              {items.map((item) => (
                <AccordionItem key={item.id} id={item.id}>
                  <AccordionTrigger>{t(item.questionKey)}</AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm leading-relaxed">
                      {t(item.answerKey)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        );
      })}
    </div>
  );
}
