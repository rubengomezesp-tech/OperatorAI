"use client";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="min-h-screen bg-bg text-fg flex items-center justify-center px-6">
      <div className="text-center max-w-[420px]">
        <div className="font-display text-[48px] text-red-400 mb-2">Error</div>
        <h1 className="font-display text-[24px] mb-3">Something went wrong</h1>
        <p className="text-[14px] text-fg-muted mb-8">An unexpected error occurred.</p>
        <button onClick={reset} className="inline-flex items-center h-10 px-5 rounded-md gold-grad text-bg text-[13px] font-medium hover:brightness-110 transition">Try again</button>
      </div>
    </div>
  );
}
