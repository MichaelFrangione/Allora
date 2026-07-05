"use client";

export default function QuizHeader({
  title,
  index,
  total,
  onExit,
  instructions,
}: {
  title: string;
  index: number;
  total: number;
  onExit: () => void;
  instructions?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-semibold">{title}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {index + 1} / {total}
          </span>
          <button
            onClick={onExit}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
            aria-label="Exit session"
          >
            ✕
          </button>
        </div>
      </div>
      {instructions && <p className="text-xs text-muted-foreground mt-1">{instructions}</p>}
    </div>
  );
}
