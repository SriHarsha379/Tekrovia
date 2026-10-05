import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCandidateDto } from './create-candidate.dto';

const valid = {
  fullName: 'Asha Rao',
  email: 'asha@example.test',
  phone: '9876543210',
};

const fields = [
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'utmContent',
  'utmTerm',
] as const;

async function errorsFor(input: Record<string, unknown>) {
  const dto = plainToInstance(CreateCandidateDto, input);
  return validate(dto, { whitelist: true });
}

describe('CreateCandidateDto campaign fields', () => {
  it('accepts a profile with every campaign field filled in', async () => {
    const errors = await errorsFor({
      ...valid,
      utmSource: 'meta',
      utmMedium: 'cpc',
      utmCampaign: 'launch',
      utmContent: 'ad-1',
      utmTerm: 'python course',
    });

    expect(errors).toHaveLength(0);
  });

  it.each(fields)('accepts %s at exactly 200 characters', async (field) => {
    expect(await errorsFor({ ...valid, [field]: 'x'.repeat(200) })).toHaveLength(0);
  });

  it.each(fields)('rejects %s above 200 characters', async (field) => {
    expect((await errorsFor({ ...valid, [field]: 'x'.repeat(201) })).length).toBeGreaterThan(0);
  });

  it.each(fields)('rejects a non-text %s', async (field) => {
    expect((await errorsFor({ ...valid, [field]: 42 })).length).toBeGreaterThan(0);
  });
});
