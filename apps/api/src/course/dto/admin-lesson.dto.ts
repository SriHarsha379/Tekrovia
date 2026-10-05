export interface AdminUpdateLessonDto {
  title?: string;
  description?: string | null;
  content?: string | null;
  videoUrl?: string | null;
  duration?: string | null;
}

const ALLOWED_FIELDS = [
  'title',
  'description',
  'content',
  'videoUrl',
  'duration',
];

function optionalText(name: string, value: unknown, max: number): void {
  if (value === undefined || value === null) return;
  if (typeof value !== 'string' || value.length > max) {
    throw new Error(`${name} must be text of at most ${max} characters, or null.`);
  }
}

export function validateAdminUpdateLesson(dto: AdminUpdateLessonDto): void {
  if (!dto || typeof dto !== 'object' || Array.isArray(dto)) {
    throw new Error('A valid lesson update object is required.');
  }

  const fields = Object.keys(dto);
  if (
    fields.length === 0 ||
    fields.some((field) => !ALLOWED_FIELDS.includes(field))
  ) {
    throw new Error('Provide at least one valid lesson field to update.');
  }

  if (
    dto.title !== undefined &&
    (typeof dto.title !== 'string' ||
      !dto.title.trim() ||
      dto.title.trim().length > 200)
  ) {
    throw new Error('title must be a non-empty string of at most 200 characters.');
  }

  optionalText('description', dto.description, 2000);
  optionalText('content', dto.content, 50000);
  optionalText('duration', dto.duration, 50);

  if (dto.videoUrl !== undefined && dto.videoUrl !== null) {
    if (typeof dto.videoUrl !== 'string' || dto.videoUrl.length > 2000) {
      throw new Error('videoUrl must be an https link of at most 2000 characters, or null.');
    }
    let url: URL;
    try {
      url = new URL(dto.videoUrl.trim());
    } catch {
      throw new Error('videoUrl must be a valid https link.');
    }
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new Error('videoUrl must be an https link without embedded credentials.');
    }
  }
}
