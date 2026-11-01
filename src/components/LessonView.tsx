"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  CheckCircle2, Loader2, BookOpen, Video,
  HelpCircle, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";

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
  if (url.includes("youtube.com/embed/") || url.includes("player.vimeo.com")) return url;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) return url;
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  return url;
}

const INTERVIEW_QUESTIONS: Record<string, string[]> = {
  default: [
    "Explain what you learned in this lesson in your own words.",
    "How would you apply this concept in a real project?",
    "What are the most common mistakes beginners make with this topic?",
    "Give an example of when you would use this in production.",
  ],
};

function getInterviewQuestions(lessonTitle: string): string[] {
  return INTERVIEW_QUESTIONS.default;
}

export default function LessonView({ lessonId, isCompleted, onComplete, completing }: Props) {
  const [showQuestions, setShowQuestions] = useState(false);
  const [aiDoubt, setAiDoubt]             = useState("");
  const [aiAnswer, setAiAnswer]           = useState<any>(null);
  const [askingDoubt, setAskingDoubt]     = useState(false);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => fetchLesson(lessonId),
    enabled: !!lessonId,
  });

  const askDoubt = useMutation({
    mutationFn: (question: string) =>
      api.post("/ai/doubt", {
        question,
        lesson_title:  lesson?.title,
        course_title:  lesson?.module?.title,
      }).then((r) => r.data),
    onSuccess: (data) => { setAiAnswer(data); setAskingDoubt(false); },
    onError: () => { setAiAnswer({ answer: "AI assistant is not available right now. Please raise a support ticket.", example: null, follow_up: [], resources: [] }); setAskingDoubt(false); },
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
  const interviewQuestions = getInterviewQuestions(lesson.title ?? "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            {lesson.module?.title}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">{lesson.title}</h1>
          {lesson.duration && <p className="mt-1 text-sm text-slate-500">{lesson.duration}</p>}
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

      {/* Video */}
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
            <BookOpen className="h-4 w-4 text-indigo-400" /> Lesson Notes
          </div>
          <div className="text-sm text-slate-300 leading-7 whitespace-pre-wrap">{lesson.content}</div>
        </div>
      )}
      {lesson.description && !lesson.content && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <p className="text-sm leading-7 text-slate-400">{lesson.description}</p>
        </div>
      )}

      {/* Interview Questions */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
        <button
          onClick={() => setShowQuestions((s) => !s)}
          className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-violet-400" />
            <p className="text-sm font-semibold text-white">Interview Questions</p>
            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">
              {interviewQuestions.length}
            </span>
          </div>
          {showQuestions
            ? <ChevronUp className="h-4 w-4 text-slate-500" />
            : <ChevronDown className="h-4 w-4 text-slate-500" />}
        </button>
        {showQuestions && (
          <div className="border-t border-white/10 px-5 pb-5 pt-4 space-y-3">
            <p className="text-xs text-slate-500">
              Practice answering these before your mock interview.
            </p>
            <ol className="space-y-3">
              {interviewQuestions.map((q, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-300 leading-6">{q}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* AI Doubt Assistant */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <p className="text-sm font-semibold text-white">AI Doubt Assistant</p>
          <span className="text-xs text-slate-500">— ask anything about this lesson</span>
        </div>
        <div className="flex gap-2">
          <input
            value={aiDoubt}
            onChange={(e) => setAiDoubt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && aiDoubt.trim()) {
                setAskingDoubt(true);
                askDoubt.mutate(aiDoubt);
              }
            }}
            placeholder="e.g. Can you explain closures with an example?"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => {
              if (aiDoubt.trim()) {
                setAskingDoubt(true);
                askDoubt.mutate(aiDoubt);
              }
            }}
            disabled={askDoubt.isPending || !aiDoubt.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-400 disabled:opacity-60 transition"
          >
            {askDoubt.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Ask
          </button>
        </div>

        {aiAnswer && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-4 space-y-3">
            <p className="text-sm text-slate-300 leading-6">{aiAnswer.answer}</p>
            {aiAnswer.example && (
              <div className="rounded-lg bg-black/30 p-3">
                <p className="text-xs font-semibold text-amber-400 mb-1">Example</p>
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-5">
                  {aiAnswer.example}
                </pre>
              </div>
            )}
            {aiAnswer.follow_up?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Follow-up questions</p>
                <ul className="space-y-1">
                  {aiAnswer.follow_up.map((q: string, i: number) => (
                    <li
                      key={i}
                      onClick={() => { setAiDoubt(q); setAiAnswer(null); }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      → {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom complete */}
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
