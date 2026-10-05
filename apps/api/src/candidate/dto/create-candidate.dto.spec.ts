import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCandidateDto } from './create-candidate.dto';

const valid = {
  fullName: 'Asha Rao',
  email: 'asha@example.test',
  phone: '9876543210',
};

async function run(input: Record<string, unknown>) {
  const dto = plainToInstance(CreateCandidateDto, input);
  const errors = await validate(dto, { whitelist: true });
  return { dto, errors };
}

describe('CreateCandidateDto registration fields', () => {
  it('accepts a profile without the new optional fields', async () => {
    const { errors } = await run(valid);
    expect(errors).toHaveLength(0);
  });

  it('accepts earlier training, a career gap and an https resume link', async () => {
    const { errors } = await run({
      ...valid,
      previousTraining: 'Two-month Python bootcamp',
      careerGapMonths: 8,
      resumeUrl: 'https://drive.example.test/resume.pdf',
    });
    expect(errors).toHaveLength(0);
  });

  it.each([0, 1, 24, 600])('accepts a career gap of %s months', async (months) => {
    const { errors } = await run({ ...valid, careerGapMonths: months });
    expect(errors).toHaveLength(0);
  });

  it.each([
    ['negative', -1],
    ['above the limit', 601],
    ['not a whole number', 2.5],
    ['text', 'six'],
  ])('rejects a career gap that is %s', async (_label, value) => {
    const { errors } = await run({ ...valid, careerGapMonths: value });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects earlier training that is too long', async () => {
    const { errors } = await run({ ...valid, previousTraining: 'x'.repeat(2001) });
    expect(errors.length).toBeGreaterThan(0);
  });

  it.each([
    'https://example.test/resume.pdf',
    'https://drive.example.test/file/d/abc123/view?usp=sharing',
    'https://example.test:8443/cv#top',
    'https://example.test',
  ])('accepts the resume link %s', async (resumeUrl) => {
    const { errors } = await run({ ...valid, resumeUrl });
    expect(errors).toHaveLength(0);
  });

  it.each([
    'http://example.test/resume.pdf',
    'javascript:alert(1)',
    'data:text/html,<script>1</script>',
    'ftp://example.test/resume.pdf',
    'https://user:pass@example.test/resume.pdf',
    'https://example.test/with space',
    'example.test/resume.pdf',
    `https://example.test/${'x'.repeat(2000)}`,
  ])('rejects the resume link %s', async (resumeUrl) => {
    const { errors } = await run({ ...valid, resumeUrl });
    expect(errors.length).toBeGreaterThan(0);
  });
});
