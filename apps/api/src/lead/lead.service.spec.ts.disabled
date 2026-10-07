import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeadService } from './lead.service';

describe('LeadService', () => {
  const prisma = {
    lead: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    candidate: { findUnique: jest.fn() },
  };

  const input = {
    name: 'Asha Rao',
    email: 'asha@example.test',
    phone: '9876543210',
  };

  const uniqueError = () =>
    Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });

  let service: LeadService;

  beforeEach(() => {
    service = new LeadService(prisma as unknown as PrismaService);
  });

  describe('createLead', () => {
    it('returns the existing lead without creating a duplicate', async () => {
      const existing = { id: 'lead-1', email: input.email };
      prisma.lead.findFirst.mockResolvedValue(existing);

      await expect(service.createLead(input)).resolves.toBe(existing);
      expect(prisma.lead.create).not.toHaveBeenCalled();
    });

    it('creates a NEW lead with a well-formed code and consent defaulting to false', async () => {
      prisma.lead.findFirst.mockResolvedValue(null);
      prisma.lead.create.mockResolvedValue({ id: 'lead-2' });

      await service.createLead(input);

      expect(prisma.lead.create).toHaveBeenCalledTimes(1);
      const data = prisma.lead.create.mock.calls[0][0].data;
      expect(data.leadCode).toMatch(/^LEAD-\d{4}-\d{6}$/);
      expect(data.status).toBe('NEW');
      expect(data.consentGiven).toBe(false);
      expect(data.email).toBe(input.email);
    });

    it('retries when the generated lead code collides', async () => {
      prisma.lead.findFirst.mockResolvedValue(null);
      prisma.lead.create
        .mockRejectedValueOnce(uniqueError())
        .mockResolvedValueOnce({ id: 'lead-3' });

      await expect(service.createLead(input)).resolves.toEqual({ id: 'lead-3' });
      expect(prisma.lead.create).toHaveBeenCalledTimes(2);
    });

    it('gives up after five collisions and rethrows', async () => {
      const error = uniqueError();
      prisma.lead.findFirst.mockResolvedValue(null);
      prisma.lead.create.mockRejectedValue(error);

      await expect(service.createLead(input)).rejects.toBe(error);
      expect(prisma.lead.create).toHaveBeenCalledTimes(5);
    });

    it('does not retry on other database errors', async () => {
      const error = new Error('connection lost');
      prisma.lead.findFirst.mockResolvedValue(null);
      prisma.lead.create.mockRejectedValue(error);

      await expect(service.createLead(input)).rejects.toBe(error);
      expect(prisma.lead.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('convertLeadToCandidate', () => {
    it('throws NotFoundException when the lead does not exist', async () => {
      prisma.lead.findUnique.mockResolvedValue(null);

      await expect(
        service.convertLeadToCandidate('lead-1', 'cand-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.lead.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the candidate does not exist', async () => {
      prisma.lead.findUnique.mockResolvedValue({ id: 'lead-1' });
      prisma.candidate.findUnique.mockResolvedValue(null);

      await expect(
        service.convertLeadToCandidate('lead-1', 'cand-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.lead.update).not.toHaveBeenCalled();
    });

    it('links the candidate and marks the lead ENROLLED', async () => {
      prisma.lead.findUnique.mockResolvedValue({ id: 'lead-1' });
      prisma.candidate.findUnique.mockResolvedValue({ id: 'cand-1' });
      prisma.lead.update.mockResolvedValue({});

      await expect(
        service.convertLeadToCandidate('lead-1', 'cand-1'),
      ).resolves.toEqual({
        leadId: 'lead-1',
        candidateId: 'cand-1',
        status: 'ENROLLED',
      });
      expect(prisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: { candidateId: 'cand-1', status: 'ENROLLED' },
      });
    });
  });
});
