/**
 * VoiceInputButton Component
 * 语音输入按钮，支持点击开始/停止录音
 */
import { memo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";

export interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  lang?: string;
  className?: string;
}

export const VoiceInputButton = memo(function VoiceInputButton({
  onTranscript,
  disabled = false,
  lang = "en-US",
  className,
}: VoiceInputButtonProps) {
  const { t } = useTranslation();

  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } =
    useVoiceRecognition({
      lang,
      onError: (error) => {
        console.error("Voice recognition error:", error);
      },
    });

  // 当 transcript 更新时，通知父组件
  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  const handleClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  }, [isListening, stopListening, resetTranscript, startListening]);

  // 不支持语音识别时隐藏按钮
  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "px-3 h-12 transition-all duration-200 group",
        "hover:bg-accent hover:scale-105 active:scale-95",
        isListening && "bg-error-muted hover:bg-error-muted/80 hover:scale-105",
        // Dark mode enhancements - Cycle #182
        "dark:hover:shadow-[0_0_8px_oklch(0.6_0.15_264/0.3)]",
        isListening && "dark:shadow-[0_0_12px_oklch(0.55_0.22_25/0.5),0_0_24px_oklch(0.55_0.22_25/0.25)]",
        className
      )}
      title={isListening ? t("chat.voice.stopRecording") : t("chat.voice.startRecording")}
      aria-label={isListening ? t("chat.voice.stopRecording") : t("chat.voice.startRecording")}
      aria-pressed={isListening}
    >
      {isListening ? (
        <MicOff className="w-[18px] h-[18px] text-error animate-bounce-subtle transition-all duration-200" aria-hidden="true" />
      ) : (
        <Mic className="w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
      )}
    </Button>
  );
});
