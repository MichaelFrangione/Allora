import { useRef, useCallback } from "react";

export function useStudySession(mode: string) {
  const sessionIdRef = useRef<string | null>(null);

  const startSession = useCallback(async () => {
    const res = await fetch("/api/study/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", mode }),
    });
    const data = await res.json();
    sessionIdRef.current = data.id;
    return data.id as string;
  }, [mode]);

  const endSession = useCallback(async () => {
    if (!sessionIdRef.current) return;
    await fetch("/api/study/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end", sessionId: sessionIdRef.current }),
    });
  }, []);

  const recordAttempt = useCallback(
    async (contentId: string, contentType: string, correct: boolean, answer?: string) => {
      await fetch("/api/study/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          contentId,
          contentType,
          correct,
          answer,
        }),
      });
    },
    []
  );

  return { startSession, endSession, recordAttempt };
}
