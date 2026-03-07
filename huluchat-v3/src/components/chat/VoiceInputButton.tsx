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
        "px-3 h-12",
        isListening && "bg-error-muted hover:bg-error-muted/80",
        className
      )}
      title={isListening ? t("chat.voice.stopRecording") : t("chat.voice.startRecording")}
      aria-label={isListening ? t("chat.voice.stopRecording") : t("chat.voice.startRecording")}
      aria-pressed={isListening}
    >
      {isListening ? (
        <MicOff className="w-[18px] h-[18px] text-error animate-pulse" />
      ) : (
        <Mic className="w-[18px] h-[18px]" />
      )}
    </Button>
  );
});
