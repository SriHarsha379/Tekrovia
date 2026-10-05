"use client";

import { useState } from "react";
import { safeHttpsUrl } from "../lib/safe-url";

export type LessonDetailsLesson = {
  id: string;
  title: string;
  content?: string | null;
  videoUrl?: string | null;
};

export default function LessonDetails({
  lesson,
}: {
  lesson: LessonDetailsLesson;
}) {
  const [open, setOpen] = useState(false);

  const notes = lesson.content && lesson.content.trim() ? lesson.content : null;
  const videoHref = safeHttpsUrl(lesson.videoUrl);

  if (!notes && !videoHref) return null;

  return (
    <div className="order-last w-full">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
      >
        {open ? "Hide lesson" : "View lesson"}
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-xl border border-white/10 bg-slate-950/60 p-4">
          {videoHref && (
            <a
              href={videoHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg border border-indigo-400/30 px-3 py-1.5 text-xs text-indigo-200 hover:bg-indigo-400/10"
            >
              Watch video ↗
            </a>
          )}
          {notes && (
            <div className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
              {notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
