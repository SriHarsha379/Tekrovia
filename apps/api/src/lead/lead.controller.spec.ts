import {
  BadRequestException,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';

describe('LeadController', () => {
  const leadService = {
    createLead: jest.fn(),
    convertLeadToCandidate: jest.fn(),
  };
  const reflector = new Reflector();

  let controller: LeadController;

  beforeEach(() => {
    controller = new LeadController(leadService as unknown as LeadService);
  });

  describe('create (public lead capture)', () => {
    const body = {
      name: 'Asha Rao',
      email: 'asha@example.test',
      phone: '9876543210',
    } as CreateLeadDto;

    it('returns only an acknowledgement for a new lead', async () => {
      leadService.createLead.mockResolvedValue({ id: 'lead-1', notes: 'internal' });

      await expect(controller.create(body)).resolves.toEqual({ received: true });
      expect(leadService.createLead).toHaveBeenCalledWith(body);
    });

    it('never exposes an existing stored lead', async () => {
      leadService.createLead.mockResolvedValue({
        id: 'lead-9',
        name: 'Someone Else',
        email: 'asha@example.test',
        phone: '9000000000',
        notes: 'internal note',
        ownerId: 'staff-1',
        candidateId: 'cand-1',
        status: 'PROSPECT',
      });

      const result = await controller.create(body);

      expect(result).toEqual({ received: true });
      expect(JSON.stringify(result)).not.toContain('internal note');
    });
  });

  describe('request validation wiring', () => {
    const reflectApi = Reflect as unknown as {
      getMetadata(key: string, target: object, prop: string): unknown[] | undefined;
    };
    const pipe = new ValidationPipe({ whitelist: true, transform: true });

    it('binds the create body to CreateLeadDto (decorator metadata is emitted)', () => {
      const paramTypes = reflectApi.getMetadata(
        'design:paramtypes',
        LeadController.prototype,
        'create',
      );
      expect(paramTypes?.[0]).toBe(CreateLeadDto);
    });

    it('rejects a malformed lead before it reaches the service', async () => {
      await expect(
        pipe.transform(
          { name: 'A', email: 'nope', phone: '12' },
          { type: 'body', metatype: CreateLeadDto },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('cleans a valid lead and drops fields the caller must not set', async () => {
      const cleaned = (await pipe.transform(
        {
          name: '  Asha Rao ',
          email: 'asha@example.test',
          phone: '98765 43210',
          status: 'ENROLLED',
        },
        { type: 'body', metatype: CreateLeadDto },
      )) as CreateLeadDto;

      expect(cleaned.name).toBe('Asha Rao');
      expect(cleaned.phone).toBe('9876543210');
      expect(cleaned).not.toHaveProperty('status');
    });
  });

  describe('convert', () => {
    it('is a POST route because it changes data', () => {
      expect(reflector.get(METHOD_METADATA, LeadController.prototype.convert)).toBe(
        RequestMethod.POST,
      );
      expect(reflector.get(PATH_METADATA, LeadController.prototype.convert)).toBe(
        ':id/convert/:candidateId',
      );
    });
  });
});
