import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateLeadDto } from './create-lead.dto';

const valid = {
  name: 'Asha Rao',
  email: 'asha@example.test',
  phone: '9876543210',
};

async function run(input: Record<string, unknown>) {
  const dto = plainToInstance(CreateLeadDto, input);
  const errors = await validate(dto, { whitelist: true });
  return { dto, errors };
}

describe('CreateLeadDto', () => {
  it('accepts a minimal valid lead', async () => {
    const { errors } = await run(valid);
    expect(errors).toHaveLength(0);
  });

  it('accepts all optional fields', async () => {
    const { errors } = await run({
      ...valid,
      courseInterest: 'Full Stack Development',
      source: 'website',
      utmSource: 'meta',
      utmMedium: 'cpc',
      utmCampaign: 'launch',
      utmContent: 'ad-1',
      utmTerm: 'python course',
      consentGiven: true,
    });
    expect(errors).toHaveLength(0);
  });

  it.each(['9876543210', '+919876543210', '98765 43210', '98765-43210'])(
    'accepts phone %s and strips spaces and hyphens',
    async (phone) => {
      const { dto, errors } = await run({ ...valid, phone });
      expect(errors).toHaveLength(0);
      expect(dto.phone).toMatch(/^\+?\d{10,15}$/);
    },
  );

  it('trims name, email and optional text fields', async () => {
    const { dto, errors } = await run({
      ...valid,
      name: '  Asha Rao  ',
      email: '  asha@example.test ',
      source: '  website ',
    });
    expect(errors).toHaveLength(0);
    expect(dto.name).toBe('Asha Rao');
    expect(dto.email).toBe('asha@example.test');
    expect(dto.source).toBe('website');
  });

  it.each([
    ['missing name', { name: undefined }],
    ['one-character name', { name: 'A' }],
    ['overlong name', { name: 'x'.repeat(151) }],
    ['missing email', { email: undefined }],
    ['malformed email', { email: 'not-an-email' }],
    ['missing phone', { phone: undefined }],
    ['short phone', { phone: '12345' }],
    ['non-numeric phone', { phone: 'abcdefghij' }],
    ['non-boolean consent', { consentGiven: 'yes' }],
    ['overlong utm field', { utmSource: 'x'.repeat(201) }],
  ])('rejects %s', async (_label, override) => {
    const { errors } = await run({ ...valid, ...override });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('strips fields that are not part of the DTO', async () => {
    const { dto } = await run({
      ...valid,
      status: 'ENROLLED',
      ownerId: 'someone',
      candidateId: 'cand-1',
    });
    expect(dto).not.toHaveProperty('status');
    expect(dto).not.toHaveProperty('ownerId');
    expect(dto).not.toHaveProperty('candidateId');
  });
});
