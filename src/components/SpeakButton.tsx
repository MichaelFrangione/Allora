"use client";

import { Volume2 } from "lucide-react";
import { useSpeech } from "@/lib/useSpeech";

// Small client island so server components can offer TTS pronunciation.
export default function SpeakButton({
  text,
  className,
  iconClassName = "h-4 w-4",
}: {
  text: string;
  className?: string;
  iconClassName?: string;
}) {
  const { speak } = useSpeech();
  return (
    <button onClick={() => speak(text)} className={className} aria-label={`Pronounce ${text}`}>
      <Volume2 className={iconClassName} />
    </button>
  );
}
