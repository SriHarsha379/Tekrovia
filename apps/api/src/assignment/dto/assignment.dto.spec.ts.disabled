import {
  validateReview,
  validateSubmission,
  validateUpsertAssignment,
} from './assignment.dto';

describe('validateUpsertAssignment', () => {
  it.each([
    [{ title: 'Build an API', instructions: 'Follow the brief.' }],
    [{ title: 'T', instructions: 'I', isRequired: false }],
  ])('accepts %j', (dto) => {
    expect(() => validateUpsertAssignment(dto)).not.toThrow();
  });

  it.each([
    ['empty object', {}],
    ['missing instructions', { title: 'T' }],
    ['blank title', { title: '  ', instructions: 'I' }],
    ['title too long', { title: 'x'.repeat(201), instructions: 'I' }],
    ['blank instructions', { title: 'T', instructions: '   ' }],
    ['instructions too long', { title: 'T', instructions: 'x'.repeat(20001) }],
    ['non-boolean isRequired', { title: 'T', instructions: 'I', isRequired: 'yes' }],
    ['unknown field', { title: 'T', instructions: 'I', lessonId: 'x' }],
  ])('rejects %s', (_label, dto) => {
    expect(() => validateUpsertAssignment(dto as never)).toThrow();
  });

  it.each([null, [], 'x'])('rejects non-object body %j', (dto) => {
    expect(() => validateUpsertAssignment(dto as never)).toThrow();
  });
});

describe('validateSubmission', () => {
  it.each([
    [{ submissionText: 'My answer' }],
    [{ submissionUrl: 'https://github.com/example/repo' }],
    [{ submissionText: 'Answer', submissionUrl: 'https://example.test/x' }],
    [{ submissionText: 'Answer', submissionUrl: null }],
  ])('accepts %j', (dto) => {
    expect(() => validateSubmission(dto)).not.toThrow();
  });

  it.each([
    ['empty object', {}],
    ['both blank', { submissionText: '  ', submissionUrl: ' ' }],
    ['both null', { submissionText: null, submissionUrl: null }],
    ['text too long', { submissionText: 'x'.repeat(20001) }],
    ['http link', { submissionUrl: 'http://example.test/x' }],
    ['javascript link', { submissionUrl: 'javascript:alert(1)' }],
    ['link with credentials', { submissionUrl: 'https://u:p@example.test/x' }],
    ['not a URL', { submissionUrl: 'not a url' }],
    ['link too long', { submissionUrl: `https://a.test/${'x'.repeat(2000)}` }],
    ['non-string text', { submissionText: 5 }],
    ['unknown field', { submissionText: 'A', status: 'APPROVED' }],
  ])('rejects %s', (_label, dto) => {
    expect(() => validateSubmission(dto as never)).toThrow();
  });
});

describe('validateReview', () => {
  it.each([
    [{ status: 'APPROVED' }],
    [{ status: 'APPROVED', feedback: 'Nice work' }],
    [{ status: 'CHANGES_REQUESTED', feedback: 'Please add tests' }],
  ])('accepts %j', (dto) => {
    expect(() => validateReview(dto as never)).not.toThrow();
  });

  it.each([
    ['empty object', {}],
    ['unknown status', { status: 'MAYBE' }],
    ['SUBMITTED is not a decision', { status: 'SUBMITTED' }],
    ['changes without feedback', { status: 'CHANGES_REQUESTED' }],
    ['changes with blank feedback', { status: 'CHANGES_REQUESTED', feedback: '   ' }],
    ['feedback too long', { status: 'APPROVED', feedback: 'x'.repeat(5001) }],
    ['unknown field', { status: 'APPROVED', reviewerId: 'x' }],
  ])('rejects %s', (_label, dto) => {
    expect(() => validateReview(dto as never)).toThrow();
  });
});
