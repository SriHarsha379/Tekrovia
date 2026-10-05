export interface UpsertAssignmentDto {
  title: string;
  instructions: string;
  isRequired?: boolean;
}

export interface SubmitAssignmentDto {
  submissionText?: string | null;
  submissionUrl?: string | null;
}

export interface ReviewSubmissionDto {
  status: 'APPROVED' | 'CHANGES_REQUESTED';
  feedback?: string | null;
}

function asObject(dto: unknown, message: string): Record<string, unknown> {
  if (!dto || typeof dto !== 'object' || Array.isArray(dto)) {
    throw new Error(message);
  }
  return dto as Record<string, unknown>;
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

export function validateUpsertAssignment(dto: UpsertAssignmentDto): void {
  const obj = asObject(dto, 'A valid assignment object is required.');
  onlyAllowed(
    obj,
    ['title', 'instructions', 'isRequired'],
    'Provide only title, instructions and isRequired.',
  );

  const title = obj.title;
  if (
    typeof title !== 'string' ||
    !title.trim() ||
    title.trim().length > 200
  ) {
    throw new Error('title must be a non-empty string of at most 200 characters.');
  }

  const instructions = obj.instructions;
  if (
    typeof instructions !== 'string' ||
    !instructions.trim() ||
    instructions.length > 20000
  ) {
    throw new Error(
      'instructions must be non-empty text of at most 20000 characters.',
    );
  }

  const isRequired = obj.isRequired;
  if (isRequired !== undefined && typeof isRequired !== 'boolean') {
    throw new Error('isRequired must be true or false.');
  }
}

export function validateSubmission(dto: SubmitAssignmentDto): void {
  const obj = asObject(dto, 'A valid submission is required.');
  onlyAllowed(
    obj,
    ['submissionText', 'submissionUrl'],
    'Provide submissionText and/or submissionUrl.',
  );
  optionalText('submissionText', obj.submissionText, 20000);
  optionalText('submissionUrl', obj.submissionUrl, 2000);

  const rawText = obj.submissionText;
  const rawUrl = obj.submissionUrl;
  const text = typeof rawText === 'string' ? rawText.trim() : '';
  const url = typeof rawUrl === 'string' ? rawUrl.trim() : '';

  if (!text && !url) {
    throw new Error('Provide your answer text, an https link, or both.');
  }
  if (url) assertHttpsUrl(url);
}

export function validateReview(dto: ReviewSubmissionDto): void {
  const obj = asObject(dto, 'A valid review is required.');
  onlyAllowed(obj, ['status', 'feedback'], 'Provide status and optional feedback.');

  const status = obj.status;
  if (status !== 'APPROVED' && status !== 'CHANGES_REQUESTED') {
    throw new Error('status must be APPROVED or CHANGES_REQUESTED.');
  }
  optionalText('feedback', obj.feedback, 5000);

  const rawFeedback = obj.feedback;
  const feedback = typeof rawFeedback === 'string' ? rawFeedback.trim() : '';
  if (status === 'CHANGES_REQUESTED' && !feedback) {
    throw new Error('feedback is required when requesting changes.');
  }
}
