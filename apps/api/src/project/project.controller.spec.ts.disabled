import {
  BadRequestException,
  ForbiddenException,
  RequestMethod,
  Type,
} from '@nestjs/common';
import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

const service = {
  upsertForCourse: jest.fn(),
  listMine: jest.fn(),
  submit: jest.fn(),
  listForReview: jest.fn(),
  review: jest.fn(),
};

const makeRequest = (role: string, id = 'user-1') => ({
  user: { id, name: 'Test User', role },
});

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
const adminRoles = ['ADMIN', 'SUPER_ADMIN'];
const reviewerRoles = ['TRAINER', 'ADMIN', 'SUPER_ADMIN'];
const nonAdminRoles = allRoles.filter((role) => !adminRoles.includes(role));
const nonReviewerRoles = allRoles.filter((role) => !reviewerRoles.includes(role));

const validProject = {
  title: 'Build an API',
  businessProblem: 'Problem',
  expectedOutcome: 'Outcome',
  milestones: [{ title: 'Design' }, { title: 'Ship' }],
};
const approve = { status: 'APPROVED' as const };

describe('ProjectController', () => {
  const reflector = new Reflector();
  let controller: ProjectController;

  beforeEach(() => {
    controller = new ProjectController(service as unknown as ProjectService);
  });

  it('has a test entry for every route handler', () => {
    const handlers = Object.getOwnPropertyNames(
      ProjectController.prototype,
    ).filter(
      (name) =>
        name !== 'constructor' &&
        !['assertAdmin', 'assertReviewer', 'validate'].includes(name),
    );

    expect([...handlers].sort()).toEqual(
      ['listForReview', 'listMine', 'review', 'submit', 'upsertForCourse'],
    );
  });

  it('is behind SessionAuthGuard', () => {
    const guards =
      reflector.get<unknown[]>(
        GUARDS_METADATA,
        ProjectController as Type<object>,
      ) ?? [];
    expect(guards).toContain(SessionAuthGuard);
  });

  const routes: Array<[string, RequestMethod, string]> = [
    ['upsertForCourse', RequestMethod.PUT, 'courses/:courseId'],
    ['listMine', RequestMethod.GET, 'my'],
    ['submit', RequestMethod.POST, 'milestones/:milestoneId/submit'],
    ['listForReview', RequestMethod.GET, 'review'],
    ['review', RequestMethod.PATCH, 'submissions/:submissionId/review'],
  ];

  it.each(routes)('%s uses the expected method and path', (name, method, path) => {
    const handler = (
      ProjectController.prototype as unknown as Record<
        string,
        (...args: unknown[]) => unknown
      >
    )[name];
    expect(reflector.get(METHOD_METADATA, handler)).toBe(method);
    expect(reflector.get(PATH_METADATA, handler)).toBe(path);
  });

  describe('upsertForCourse (admin only)', () => {
    it.each(nonAdminRoles)('forbids %s and never calls the service', (role) => {
      expect(() =>
        controller.upsertForCourse(makeRequest(role), 'course-1', validProject),
      ).toThrow(ForbiddenException);
      expect(service.upsertForCourse).not.toHaveBeenCalled();
    });

    it.each(adminRoles)('allows %s', (role) => {
      controller.upsertForCourse(makeRequest(role), 'course-1', validProject);
      expect(service.upsertForCourse).toHaveBeenCalledWith('course-1', validProject);
    });

    it('rejects an invalid body before reaching the service', () => {
      expect(() =>
        controller.upsertForCourse(makeRequest('ADMIN'), 'course-1', {} as never),
      ).toThrow(BadRequestException);
      expect(service.upsertForCourse).not.toHaveBeenCalled();
    });
  });

  describe('student routes', () => {
    it.each(allRoles)('listMine is open to %s and uses the session user', (role) => {
      controller.listMine(makeRequest(role, 'student-9'));
      expect(service.listMine).toHaveBeenCalledWith('student-9');
    });

    it.each(allRoles)('submit is open to %s and uses the session user', (role) => {
      const body = { submissionText: 'My work' };
      controller.submit(makeRequest(role, 'student-9'), 'ms-1', body);
      expect(service.submit).toHaveBeenCalledWith('student-9', 'ms-1', body);
    });

    it.each([
      ['empty body', {}],
      ['http link', { submissionUrl: 'http://example.test/x' }],
      ['javascript link', { submissionUrl: 'javascript:alert(1)' }],
    ])('submit rejects %s before reaching the service', (_label, body) => {
      expect(() =>
        controller.submit(makeRequest('STUDENT'), 'ms-1', body as never),
      ).toThrow(BadRequestException);
      expect(service.submit).not.toHaveBeenCalled();
    });
  });

  describe('review routes (trainer or admin)', () => {
    it.each(nonReviewerRoles)('listForReview forbids %s', (role) => {
      expect(() => controller.listForReview(makeRequest(role))).toThrow(
        ForbiddenException,
      );
      expect(service.listForReview).not.toHaveBeenCalled();
    });

    it.each(reviewerRoles)('listForReview allows %s and passes filters through', (role) => {
      controller.listForReview(makeRequest(role), 'APPROVED', '2', '10');
      expect(service.listForReview).toHaveBeenCalledWith({
        status: 'APPROVED',
        page: '2',
        limit: '10',
      });
    });

    it.each(nonReviewerRoles)('review forbids %s and never calls the service', (role) => {
      expect(() => controller.review(makeRequest(role), 'sub-1', approve)).toThrow(
        ForbiddenException,
      );
      expect(service.review).not.toHaveBeenCalled();
    });

    it.each(reviewerRoles)('review allows %s and passes the reviewer identity', (role) => {
      const request = makeRequest(role, 'reviewer-7');
      controller.review(request, 'sub-1', approve);
      expect(service.review).toHaveBeenCalledWith(request.user, 'sub-1', approve);
    });

    it.each([
      ['changes without feedback', { status: 'CHANGES_REQUESTED' }],
      ['unknown status', { status: 'MAYBE' }],
      ['empty body', {}],
    ])('review rejects %s before reaching the service', (_label, body) => {
      expect(() =>
        controller.review(makeRequest('TRAINER'), 'sub-1', body as never),
      ).toThrow(BadRequestException);
      expect(service.review).not.toHaveBeenCalled();
    });
  });
});
