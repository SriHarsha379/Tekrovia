import { CreateCourseDto, validateCreateCourse } from './create-course.dto';

export interface AdminCreateCourseDto extends CreateCourseDto {
  status?: 'DRAFT' | 'PUBLISHED';
}

export function validateAdminCreateCourse(dto: AdminCreateCourseDto): void {
  validateCreateCourse(dto);

  if (
    dto.status !== undefined &&
    !['DRAFT', 'PUBLISHED'].includes(dto.status)
  ) {
    throw new Error('status must be DRAFT or PUBLISHED.');
  }
}

export type AdminUpdateCourseDto = Partial<CreateCourseDto>;

export function validateAdminUpdateCourse(dto: AdminUpdateCourseDto): void {
  if (!dto || typeof dto !== 'object' || Array.isArray(dto)) {
    throw new Error('A valid course update object is required.');
  }

  const allowedFields = [
    'title',
    'category',
    'description',
    'duration',
    'level',
    'price',
    'learningOutcomes',
    'curriculum',
  ];
  const fields = Object.keys(dto);

  if (
    fields.length === 0 ||
    fields.some((field) => !allowedFields.includes(field))
  ) {
    throw new Error('Provide at least one valid course field to update.');
  }

  if (dto.title !== undefined &&
      (typeof dto.title !== 'string' || !dto.title.trim())) {
    throw new Error('title must be a non-empty string.');
  }
  if (dto.category !== undefined &&
      (typeof dto.category !== 'string' || !dto.category.trim())) {
    throw new Error('category must be a non-empty string.');
  }
  if (dto.description !== undefined &&
      (typeof dto.description !== 'string' || !dto.description.trim())) {
    throw new Error('description must be a non-empty string.');
  }
  if (dto.duration !== undefined &&
      (typeof dto.duration !== 'string' || !dto.duration.trim())) {
    throw new Error('duration must be a non-empty string.');
  }
  if (dto.level !== undefined &&
      !['beginner', 'intermediate', 'advanced'].includes(dto.level)) {
    throw new Error('Invalid course level.');
  }
  if (dto.price !== undefined &&
      (!Number.isFinite(dto.price) || dto.price < 0)) {
    throw new Error('price must be a non-negative number.');
  }
  if (dto.learningOutcomes !== undefined &&
      (!Array.isArray(dto.learningOutcomes) ||
       !dto.learningOutcomes.every(
         (item) => typeof item === 'string' && item.trim().length > 0,
       ))) {
    throw new Error('learningOutcomes must contain non-empty strings.');
  }
  if (dto.curriculum !== undefined &&
      (!Array.isArray(dto.curriculum) ||
       !dto.curriculum.every(
         (item) =>
           item &&
           typeof item.module === 'string' &&
           item.module.trim().length > 0 &&
           Array.isArray(item.topics) &&
           item.topics.every(
             (topic) => typeof topic === 'string' && topic.trim().length > 0,
           ),
       ))) {
    throw new Error(
      'curriculum must contain modules with non-empty topic arrays.',
    );
  }
}
