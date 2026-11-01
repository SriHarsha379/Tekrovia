"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { CheckCircle2, Loader2, BookOpen, Video } from "lucide-react";

interface Props {
  lessonId: string;
  isCompleted: boolean;
  onComplete: () => void;
  completing: boolean;
}

const fetchLesson = (id: string) =>
  api.get(`/courses/lessons/${id}`).then((r) => r.data);

function getEmbedUrl(url: string): string | null {
  if (!url) return null;

  // Already an embed URL
  if (url.includes("youtube.com/embed/") || url.includes("player.vimeo.com")) {
    return url;
  }

  // YouTube watch URL → embed
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo URL → embed
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Loom URL → embed
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;

  // Direct video file (mp4, webm) — use as-is
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) return url;

  // Google Drive — convert to embed
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;

  return url;
}

export default function LessonView({
  lessonId,
  isCompleted,
  onComplete,
  completing,
}: Props) {
  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => fetchLesson(lessonId),
    enabled: !!lessonId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-8 text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading lesson…
      </div>
    );
  }

  if (!lesson) return <p className="p-8 text-slate-400">Lesson not found.</p>;

  const embedUrl = lesson.videoUrl ? getEmbedUrl(lesson.videoUrl) : null;
  const isDirectVideo = embedUrl?.match(/\.(mp4|webm|ogg)(\?.*)?$/i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            {lesson.module?.title}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">{lesson.title}</h1>
          {lesson.duration && (
            <p className="mt-1 text-sm text-slate-500">{lesson.duration}</p>
          )}
        </div>

        {isCompleted ? (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
          </span>
        ) : (
          <button
            onClick={onComplete}
            disabled={completing}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
          >
            {completing && <Loader2 className="h-3 w-3 animate-spin" />}
            Mark complete
          </button>
        )}
      </div>

      {/* Video — iframe for YouTube/Vimeo/Loom, video tag for direct files */}
      {embedUrl && !isDirectVideo && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black aspect-video">
          <iframe
            src={embedUrl}
            className="h-full w-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={lesson.title}
          />
        </div>
      )}

      {embedUrl && isDirectVideo && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black aspect-video">
          <video src={embedUrl} controls className="h-full w-full" />
        </div>
      )}

      {!embedUrl && lesson.hasVideo && (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-5 text-slate-400">
          <Video className="h-5 w-5 shrink-0 text-indigo-400" />
          <p className="text-sm">Video is being set up — check back soon.</p>
        </div>
      )}

      {/* Notes */}
      {lesson.content && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-300">
            <BookOpen className="h-4 w-4 text-indigo-400" />
            Lesson Notes
          </div>
          <div className="text-sm text-slate-300 leading-7 whitespace-pre-wrap">
            {lesson.content}
          </div>
        </div>
      )}

      {lesson.description && !lesson.content && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <p className="text-sm leading-7 text-slate-400">{lesson.description}</p>
        </div>
      )}

      {/* Bottom complete button */}
      {!isCompleted && (
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={onComplete}
            disabled={completing}
            className="flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
          >
            {completing
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <CheckCircle2 className="h-4 w-4" />}
            Mark this lesson complete
          </button>
        </div>
      )}
    </div>
  );
}
