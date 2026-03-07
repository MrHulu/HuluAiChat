/**
 * WelcomeDialog Component
 * 首次启动引导弹窗，帮助新用户了解核心功能
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const steps = [
  {
    key: "welcome",
    icon: "👋",
    titleKey: "welcome.step1.title",
    descKey: "welcome.step1.description",
  },
  {
    key: "rag",
    icon: "📚",
    titleKey: "welcome.step2.title",
    descKey: "welcome.step2.description",
  },
  {
    key: "plugins",
    icon: "🔌",
    titleKey: "welcome.step3.title",
    descKey: "welcome.step3.description",
  },
];

export function WelcomeDialog({ open, onOpenChange, onComplete }: WelcomeDialogProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
      onOpenChange(false);
    }
  };

  const handleSkip = () => {
    onComplete();
    onOpenChange(false);
  };

  const step = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{t(step.titleKey)}</DialogTitle>
          <DialogDescription className="text-base pt-2">
            {t(step.descKey)}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 py-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentStep
                  ? "bg-primary"
                  : index < currentStep
                    ? "bg-primary/50"
                    : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Icon display */}
        <div className="flex justify-center py-6">
          <span className="text-6xl">{step.icon}</span>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between gap-2">
          <Button variant="ghost" onClick={handleSkip}>
            {t("welcome.skip")}
          </Button>
          <Button onClick={handleNext}>
            {currentStep < steps.length - 1
              ? t("welcome.next")
              : t("welcome.getStarted")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
