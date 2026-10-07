import {
  validateMilestoneSubmission,
  validateProjectReview,
  validateUpsertProject,
} from './project.dto';

const milestone = (n: number) => ({ title: `Milestone ${n}` });

const validProject = {
  title: 'Build a REST API',
  businessProblem: 'A shop needs an API.',
  expectedOutcome: 'A working service.',
  milestones: [milestone(1), milestone(2)],
};

describe('validateUpsertProject', () => {
  it.each([
    [validProject],
    [{ ...validProject, id: 'proj-1', isRequired: false, resources: 'Starter repo' }],
    [{ ...validProject, milestones: [{ title: 'Only', description: 'D', dueOffsetDays: 14 }] }],
    [{ ...validProject, milestones: [1, 2, 3, 4, 5].map(milestone) }],
  ])('accepts %j', (dto) => {
    expect(() => validateUpsertProject(dto as never)).not.toThrow();
  });

  it.each([
    ['empty object', {}],
    ['blank title', { ...validProject, title: ' ' }],
    ['title too long', { ...validProject, title: 'x'.repeat(201) }],
    ['missing business problem', { ...validProject, businessProblem: undefined }],
    ['missing expected outcome', { ...validProject, expectedOutcome: '' }],
    ['non-boolean isRequired', { ...validProject, isRequired: 'yes' }],
    ['no milestones', { ...validProject, milestones: [] }],
    ['six milestones', { ...validProject, milestones: [1, 2, 3, 4, 5, 6].map(milestone) }],
    ['milestones not an array', { ...validProject, milestones: 'm' }],
    ['milestone without a title', { ...validProject, milestones: [{ title: ' ' }] }],
    ['milestone with unknown field', { ...validProject, milestones: [{ title: 'T', isFinal: true }] }],
    ['due date zero', { ...validProject, milestones: [{ title: 'T', dueOffsetDays: 0 }] }],
    ['due date not an integer', { ...validProject, milestones: [{ title: 'T', dueOffsetDays: 1.5 }] }],
    ['due date too far out', { ...validProject, milestones: [{ title: 'T', dueOffsetDays: 731 }] }],
    ['unknown project field', { ...validProject, courseId: 'x' }],
  ])('rejects %s', (_label, dto) => {
    expect(() => validateUpsertProject(dto as never)).toThrow();
  });

  it.each([null, [], 'x'])('rejects non-object body %j', (dto) => {
    expect(() => validateUpsertProject(dto as never)).toThrow();
  });
});

describe('validateMilestoneSubmission', () => {
  it.each([
    [{ submissionText: 'Done' }],
    [{ submissionUrl: 'https://github.com/example/repo' }],
    [{ submissionText: 'Done', submissionUrl: 'https://example.test/x' }],
  ])('accepts %j', (dto) => {
    expect(() => validateMilestoneSubmission(dto)).not.toThrow();
  });

  it.each([
    ['empty object', {}],
    ['both blank', { submissionText: ' ', submissionUrl: ' ' }],
    ['http link', { submissionUrl: 'http://example.test/x' }],
    ['javascript link', { submissionUrl: 'javascript:alert(1)' }],
    ['link with credentials', { submissionUrl: 'https://u:p@example.test/x' }],
    ['text too long', { submissionText: 'x'.repeat(20001) }],
    ['unknown field', { submissionText: 'A', status: 'APPROVED' }],
  ])('rejects %s', (_label, dto) => {
    expect(() => validateMilestoneSubmission(dto as never)).toThrow();
  });
});

describe('validateProjectReview', () => {
  it.each([
    [{ status: 'APPROVED' }],
    [{ status: 'APPROVED', feedback: 'Great', vivaNotes: 'Explained the design well' }],
    [{ status: 'CHANGES_REQUESTED', feedback: 'Add tests' }],
  ])('accepts %j', (dto) => {
    expect(() => validateProjectReview(dto as never)).not.toThrow();
  });

  it.each([
    ['empty object', {}],
    ['unknown status', { status: 'MAYBE' }],
    ['changes without feedback', { status: 'CHANGES_REQUESTED' }],
    ['changes with blank feedback', { status: 'CHANGES_REQUESTED', feedback: '  ' }],
    ['viva notes too long', { status: 'APPROVED', vivaNotes: 'x'.repeat(5001) }],
    ['unknown field', { status: 'APPROVED', reviewerId: 'x' }],
  ])('rejects %s', (_label, dto) => {
    expect(() => validateProjectReview(dto as never)).toThrow();
  });
});
