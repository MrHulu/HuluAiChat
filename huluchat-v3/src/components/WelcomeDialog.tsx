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
          <DialogTitle
            key={`title-${step.key}`}
            className="text-xl animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
          >
            {t(step.titleKey)}
          </DialogTitle>
          <DialogDescription
            key={`desc-${step.key}`}
            className="text-base pt-2 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
          >
            {t(step.descKey)}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div
          className="flex justify-center gap-2 py-4"
          role="navigation"
          aria-label={t("welcome.stepIndicator")}
        >
          {steps.map((s, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentStep(index)}
              aria-current={index === currentStep ? "step" : undefined}
              aria-label={t("welcome.stepLabel", { step: index + 1, title: t(s.titleKey) })}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "hover:scale-125 active:scale-110",
                index === currentStep
                  ? "bg-primary w-6"
                  : index < currentStep
                    ? "bg-primary/50 hover:bg-primary/70"
                    : "bg-muted hover:bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {/* Icon display with animation */}
        <div className="flex justify-center py-6" aria-hidden="true">
          <span
            key={step.key}
            className="text-6xl animate-in zoom-in-50 duration-300"
          >
            {step.icon}
          </span>
        </div>

        {/* Progress info for screen readers */}
        <div className="sr-only" aria-live="polite">
          {t("welcome.stepProgress", { current: currentStep + 1, total: steps.length })}
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
