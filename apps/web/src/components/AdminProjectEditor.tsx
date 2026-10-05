"use client";

import { useState, type FormEvent } from "react";
import { adminApi } from "../lib/admin-api";
import { apiErrorMessage } from "../lib/error-message";

export type AdminMilestone = {
  id: string;
  title: string;
  description?: string | null;
  dueOffsetDays?: number | null;
  isFinal?: boolean;
};

export type AdminProject = {
  id: string;
  title: string;
  businessProblem: string;
  expectedOutcome: string;
  resources?: string | null;
  isRequired: boolean;
  milestones: AdminMilestone[];
};

type MilestoneDraft = { title: string; description: string; dueOffsetDays: string };

type Draft = {
  id?: string;
  title: string;
  businessProblem: string;
  expectedOutcome: string;
  resources: string;
  isRequired: boolean;
  milestones: MilestoneDraft[];
};

const MAX_MILESTONES = 5;

const fieldClass =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400";
const smallButton =
  "rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50";

const emptyMilestone = (): MilestoneDraft => ({
  title: "",
  description: "",
  dueOffsetDays: "",
});

function newDraft(): Draft {
  return {
    title: "",
    businessProblem: "",
    expectedOutcome: "",
    resources: "",
    isRequired: true,
    milestones: [emptyMilestone()],
  };
}

function toDraft(project: AdminProject): Draft {
  return {
    id: project.id,
    title: project.title,
    businessProblem: project.businessProblem,
    expectedOutcome: project.expectedOutcome,
    resources: project.resources ?? "",
    isRequired: project.isRequired,
    milestones: project.milestones.map((milestone) => ({
      title: milestone.title,
      description: milestone.description ?? "",
      dueOffsetDays:
        milestone.dueOffsetDays === null || milestone.dueOffsetDays === undefined
          ? ""
          : String(milestone.dueOffsetDays),
    })),
  };
}

export default function AdminProjectEditor({
  courseId,
  projects: initialProjects,
}: {
  courseId: string;
  projects: AdminProject[];
}) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<AdminProject[]>(initialProjects);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function updateMilestone(index: number, key: keyof MilestoneDraft, value: string) {
    setDraft((current) =>
      current
        ? {
            ...current,
            milestones: current.milestones.map((item, itemIndex) =>
              itemIndex === index ? { ...item, [key]: value } : item,
            ),
          }
        : current,
    );
  }

  function addMilestone() {
    setDraft((current) =>
      current && current.milestones.length < MAX_MILESTONES
        ? { ...current, milestones: [...current.milestones, emptyMilestone()] }
        : current,
    );
  }

  function removeMilestone(index: number) {
    setDraft((current) =>
      current && current.milestones.length > 1
        ? {
            ...current,
            milestones: current.milestones.filter((_, itemIndex) => itemIndex !== index),
          }
        : current,
    );
  }

  function begin(next: Draft) {
    setDraft(next);
    setError("");
    setNotice("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;

    setError("");
    setNotice("");

    const title = draft.title.trim();
    const businessProblem = draft.businessProblem.trim();
    const expectedOutcome = draft.expectedOutcome.trim();

    if (!title || !businessProblem || !expectedOutcome) {
      setError("Title, business problem and expected outcome are required.");
      return;
    }

    const milestones: Array<{
      title: string;
      description: string | null;
      dueOffsetDays: number | null;
    }> = [];

    for (const [index, item] of draft.milestones.entries()) {
      const milestoneTitle = item.title.trim();
      if (!milestoneTitle) {
        setError(`Milestone ${index + 1} needs a title.`);
        return;
      }

      let dueOffsetDays: number | null = null;
      const rawDue = item.dueOffsetDays.trim();
      if (rawDue) {
        const parsed = Number(rawDue);
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 730) {
          setError(`Milestone ${index + 1} due days must be a whole number from 1 to 730.`);
          return;
        }
        dueOffsetDays = parsed;
      }

      milestones.push({
        title: milestoneTitle,
        description: item.description.trim() || null,
        dueOffsetDays,
      });
    }

    setSaving(true);
    try {
      const response = await adminApi.put<AdminProject>(
        `/projects/courses/${courseId}`,
        {
          ...(draft.id ? { id: draft.id } : {}),
          title,
          businessProblem,
          expectedOutcome,
          resources: draft.resources.trim() || null,
          isRequired: draft.isRequired,
          milestones,
        },
      );
      const saved = response.data;

      setProjects((current) =>
        draft.id
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [...current, saved],
      );
      setDraft(null);
      setNotice("Project saved.");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={smallButton}
      >
        {open
          ? "Hide projects"
          : `Projects (${projects.length})`}
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-400">
            The last milestone is the final one and needs administrator approval.
            Once learners have submitted work, milestones can be reworded but not
            added or removed.
          </p>

          {error && (
            <div role="alert" className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-200">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-xs text-emerald-200">
              {notice}
            </div>
          )}

          {projects.map((project) => (
            <div key={project.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-words text-sm text-slate-200">{project.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {project.milestones.length}{" "}
                    {project.milestones.length === 1 ? "milestone" : "milestones"} ·{" "}
                    {project.isRequired ? "Required" : "Optional"}
                  </p>
                </div>
                {draft?.id !== project.id && (
                  <button
                    type="button"
                    onClick={() => begin(toDraft(project))}
                    aria-label={`Edit project ${project.title}`}
                    className={smallButton}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}

          {draft ? (
            <form onSubmit={save} className="space-y-3 rounded-xl border border-indigo-400/20 p-4">
              <label className="block text-xs text-slate-300">
                Project title
                <input
                  className={fieldClass}
                  maxLength={200}
                  value={draft.title}
                  onChange={(event) => update("title", event.target.value)}
                />
              </label>
              <label className="block text-xs text-slate-300">
                Business problem
                <textarea
                  rows={4}
                  className={fieldClass}
                  maxLength={20000}
                  value={draft.businessProblem}
                  onChange={(event) => update("businessProblem", event.target.value)}
                />
              </label>
              <label className="block text-xs text-slate-300">
                Expected outcome
                <textarea
                  rows={3}
                  className={fieldClass}
                  maxLength={20000}
                  value={draft.expectedOutcome}
                  onChange={(event) => update("expectedOutcome", event.target.value)}
                />
              </label>
              <label className="block text-xs text-slate-300">
                Starter resources (plain text)
                <textarea
                  rows={3}
                  className={fieldClass}
                  maxLength={20000}
                  value={draft.resources}
                  onChange={(event) => update("resources", event.target.value)}
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={draft.isRequired}
                  onChange={(event) => update("isRequired", event.target.checked)}
                />
                Required project
              </label>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Milestones
                </p>
                {draft.milestones.map((milestone, index) => (
                  <div key={index} className="space-y-2 rounded-lg border border-white/10 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Milestone {index + 1}
                        {index === draft.milestones.length - 1 ? " (final)" : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        disabled={draft.milestones.length <= 1}
                        aria-label={`Remove milestone ${index + 1}`}
                        className={smallButton}
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      className={fieldClass}
                      maxLength={200}
                      aria-label={`Milestone ${index + 1} title`}
                      placeholder="Milestone title"
                      value={milestone.title}
                      onChange={(event) => updateMilestone(index, "title", event.target.value)}
                    />
                    <textarea
                      rows={2}
                      className={fieldClass}
                      maxLength={5000}
                      aria-label={`Milestone ${index + 1} description`}
                      placeholder="What the learner should deliver"
                      value={milestone.description}
                      onChange={(event) => updateMilestone(index, "description", event.target.value)}
                    />
                    <input
                      className={fieldClass}
                      inputMode="numeric"
                      aria-label={`Milestone ${index + 1} due days after enrollment`}
                      placeholder="Due days after enrollment (optional)"
                      value={milestone.dueOffsetDays}
                      onChange={(event) => updateMilestone(index, "dueOffsetDays", event.target.value)}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMilestone}
                  disabled={draft.milestones.length >= MAX_MILESTONES}
                  className={smallButton}
                >
                  Add milestone
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save project"}
                </button>
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  disabled={saving}
                  className={smallButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button type="button" onClick={() => begin(newDraft())} className={smallButton}>
              Add project
            </button>
          )}
        </div>
      )}
    </div>
  );
}
