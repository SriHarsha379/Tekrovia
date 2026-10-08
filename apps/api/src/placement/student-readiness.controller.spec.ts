import { RequestMethod, Type } from '@nestjs/common';
import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { PlacementService } from './placement.service';
import { StudentReadinessController } from './student-readiness.controller';

const allRoles = [
  'STUDENT',
  'TRAINER',
  'COUNSELLOR',
  'SUPPORT_STAFF',
  'PLACEMENT_MANAGER',
  'RECRUITER',
  'ADMIN',
  'SUPER_ADMIN',
];

describe('StudentReadinessController', () => {
  const service = { getStudentReadiness: jest.fn() };
  const reflector = new Reflector();
  let controller: StudentReadinessController;

  beforeEach(() => {
    controller = new StudentReadinessController(
      service as unknown as PlacementService,
    );
  });

  it('is behind SessionAuthGuard', () => {
    const guards =
      reflector.get<unknown[]>(
        GUARDS_METADATA,
        StudentReadinessController as Type<object>,
      ) ?? [];
    expect(guards).toContain(SessionAuthGuard);
  });

  it('exposes exactly one route: GET placements/me/readiness', () => {
    const handlers = Object.getOwnPropertyNames(
      StudentReadinessController.prototype,
    ).filter((name) => name !== 'constructor');
    expect(handlers).toEqual(['getMine']);

    const handler = StudentReadinessController.prototype.getMine;
    expect(reflector.get(METHOD_METADATA, handler)).toBe(RequestMethod.GET);
    expect(reflector.get(PATH_METADATA, handler)).toBe('me/readiness');
    expect(
      reflector.get(PATH_METADATA, StudentReadinessController as Type<object>),
    ).toBe('placements');
  });

  it.each(allRoles)('%s gets only their own checklist, found by session user', (role) => {
    service.getStudentReadiness.mockReturnValue({ profileComplete: false });

    controller.getMine({ user: { id: 'user-7', role } });

    expect(service.getStudentReadiness).toHaveBeenCalledTimes(1);
    expect(service.getStudentReadiness).toHaveBeenCalledWith('user-7');
  });
});
