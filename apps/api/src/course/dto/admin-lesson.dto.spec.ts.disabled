import { validateAdminUpdateLesson } from './admin-lesson.dto';

describe('validateAdminUpdateLesson', () => {
  it.each([
    [{ title: 'New title' }],
    [{ content: 'Notes for learners' }],
    [{ videoUrl: 'https://video.example.test/watch?v=1' }],
    [{ description: null, content: null, videoUrl: null, duration: null }],
    [{ title: 'T', description: 'D', content: 'C', videoUrl: 'https://a.test/v', duration: '12 min' }],
  ])('accepts %j', (dto) => {
    expect(() => validateAdminUpdateLesson(dto)).not.toThrow();
  });

  it.each([
    ['empty object', {}],
    ['unknown field', { title: 'T', isPublished: true }],
    ['sortOrder is not editable', { sortOrder: 3 }],
    ['moduleId is not editable', { moduleId: 'm-2' }],
    ['blank title', { title: '   ' }],
    ['title too long', { title: 'x'.repeat(201) }],
    ['non-string title', { title: 5 }],
    ['content too long', { content: 'x'.repeat(50001) }],
    ['duration too long', { duration: 'x'.repeat(51) }],
    ['http video link', { videoUrl: 'http://video.example.test/1' }],
    ['javascript video link', { videoUrl: 'javascript:alert(1)' }],
    ['data video link', { videoUrl: 'data:text/html,<script>1</script>' }],
    ['video link with credentials', { videoUrl: 'https://user:pass@video.example.test/1' }],
    ['not a URL', { videoUrl: 'not a url' }],
    ['video link too long', { videoUrl: `https://a.test/${'x'.repeat(2000)}` }],
  ])('rejects %s', (_label, dto) => {
    expect(() =>
      validateAdminUpdateLesson(dto as Parameters<typeof validateAdminUpdateLesson>[0]),
    ).toThrow();
  });

  it('rejects non-object bodies', () => {
    expect(() => validateAdminUpdateLesson(null as never)).toThrow();
    expect(() => validateAdminUpdateLesson([] as never)).toThrow();
    expect(() => validateAdminUpdateLesson('x' as never)).toThrow();
  });
});
