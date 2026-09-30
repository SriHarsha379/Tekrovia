export interface CreateCourseDto {
  title: string;
  category?: string;
  description: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price?: number;
  learningOutcomes?: string[];
  curriculum?: Array<{
    module: string;
    topics: string[];
  }>;
}

export function validateCreateCourse(dto: CreateCourseDto): void {
  if (
    !dto ||
    typeof dto.title !== 'string' ||
    !dto.title.trim() ||
    typeof dto.description !== 'string' ||
    !dto.description.trim() ||
    typeof dto.duration !== 'string' ||
    !dto.duration.trim() ||
    !['beginner', 'intermediate', 'advanced'].includes(dto.level)
  ) {
    throw new Error(
      'title, description, duration and a valid level are required.',
    );
  }

  if (
    dto.price !== undefined &&
    (!Number.isFinite(dto.price) || dto.price < 0)
  ) {
    throw new Error('price must be a non-negative number.');
  }

  if (
    dto.learningOutcomes !== undefined &&
    (!Array.isArray(dto.learningOutcomes) ||
      !dto.learningOutcomes.every((item) => typeof item === 'string'))
  ) {
    throw new Error('learningOutcomes must be an array of strings.');
  }

  if (
    dto.curriculum !== undefined &&
    (!Array.isArray(dto.curriculum) ||
      !dto.curriculum.every(
        (item) =>
          typeof item.module === 'string' &&
          Array.isArray(item.topics) &&
          item.topics.every((topic) => typeof topic === 'string'),
      ))
  ) {
    throw new Error('curriculum must contain modules with topic arrays.');
  }
}
