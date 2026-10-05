export interface MilestoneInput {
  title: string;
  description?: string | null;
  dueOffsetDays?: number | null;
}

export interface UpsertProjectDto {
  id?: string;
  title: string;
  businessProblem: string;
  expectedOutcome: string;
  resources?: string | null;
  isRequired?: boolean;
  milestones: MilestoneInput[];
}

export interface SubmitMilestoneDto {
  submissionText?: string | null;
  submissionUrl?: string | null;
}

export interface ReviewProjectSubmissionDto {
  status: 'APPROVED' | 'CHANGES_REQUESTED';
  feedback?: string | null;
  vivaNotes?: string | null;
}

export const MAX_MILESTONES = 5;

function asObject(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(message);
  }
  return value as Record<string, unknown>;
}

function onlyAllowed(
  obj: Record<string, unknown>,
  allowed: string[],
  message: string,
): void {
  const fields = Object.keys(obj);
  if (fields.length === 0 || fields.some((field) => !allowed.includes(field))) {
    throw new Error(message);
  }
}

function requiredText(
  name: string,
  value: unknown,
  max: number,
): void {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new Error(
      `${name} must be non-empty text of at most ${max} characters.`,
    );
  }
}

function optionalText(name: string, value: unknown, max: number): void {
  if (value === undefined || value === null) return;
  if (typeof value !== 'string' || value.length > max) {
    throw new Error(`${name} must be text of at most ${max} characters.`);
  }
}

function assertHttpsUrl(value: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('submissionUrl must be a valid https link.');
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error(
      'submissionUrl must be an https link without embedded credentials.',
    );
  }
}

export function validateUpsertProject(dto: UpsertProjectDto): void {
  const obj = asObject(dto, 'A valid project object is required.');
  onlyAllowed(
    obj,
    [
      'id',
      'title',
      'businessProblem',
      'expectedOutcome',
      'resources',
      'isRequired',
      'milestones',
    ],
    'Unknown project field.',
  );

  if (obj.id !== undefined && (typeof obj.id !== 'string' || !obj.id)) {
    throw new Error('id must be a non-empty string when provided.');
  }
  requiredText('title', obj.title, 200);
  requiredText('businessProblem', obj.businessProblem, 20000);
  requiredText('expectedOutcome', obj.expectedOutcome, 20000);
  optionalText('resources', obj.resources, 20000);

  if (obj.isRequired !== undefined && typeof obj.isRequired !== 'boolean') {
    throw new Error('isRequired must be true or false.');
  }

  const milestones = obj.milestones;
  if (
    !Array.isArray(milestones) ||
    milestones.length < 1 ||
    milestones.length > MAX_MILESTONES
  ) {
    throw new Error(
      `A project needs between 1 and ${MAX_MILESTONES} milestones.`,
    );
  }

  milestones.forEach((item: unknown, index: number) => {
    const milestone = asObject(item, `Milestone ${index + 1} is invalid.`);
    onlyAllowed(
      milestone,
      ['title', 'description', 'dueOffsetDays'],
      `Milestone ${index + 1} has an unknown field.`,
    );
    requiredText(`Milestone ${index + 1} title`, milestone.title, 200);
    optionalText(`Milestone ${index + 1} description`, milestone.description, 5000);

    const due = milestone.dueOffsetDays;
    if (due !== undefined && due !== null) {
      if (typeof due !== 'number' || !Number.isInteger(due) || due < 1 || due > 730) {
        throw new Error(
          `Milestone ${index + 1} dueOffsetDays must be a whole number from 1 to 730.`,
        );
      }
    }
  });
}

export function validateMilestoneSubmission(dto: SubmitMilestoneDto): void {
  const obj = asObject(dto, 'A valid submission is required.');
  onlyAllowed(
    obj,
    ['submissionText', 'submissionUrl'],
    'Provide submissionText and/or submissionUrl.',
  );
  optionalText('submissionText', obj.submissionText, 20000);
  optionalText('submissionUrl', obj.submissionUrl, 2000);

  const text =
    typeof obj.submissionText === 'string' ? obj.submissionText.trim() : '';
  const url =
    typeof obj.submissionUrl === 'string' ? obj.submissionUrl.trim() : '';

  if (!text && !url) {
    throw new Error('Provide your work as text, an https link, or both.');
  }
  if (url) assertHttpsUrl(url);
}

export function validateProjectReview(dto: ReviewProjectSubmissionDto): void {
  const obj = asObject(dto, 'A valid review is required.');
  onlyAllowed(
    obj,
    ['status', 'feedback', 'vivaNotes'],
    'Provide status, feedback and optional vivaNotes.',
  );

  if (obj.status !== 'APPROVED' && obj.status !== 'CHANGES_REQUESTED') {
    throw new Error('status must be APPROVED or CHANGES_REQUESTED.');
  }
  optionalText('feedback', obj.feedback, 5000);
  optionalText('vivaNotes', obj.vivaNotes, 5000);

  const feedback =
    typeof obj.feedback === 'string' ? obj.feedback.trim() : '';
  if (obj.status === 'CHANGES_REQUESTED' && !feedback) {
    throw new Error('feedback is required when requesting changes.');
  }
}
