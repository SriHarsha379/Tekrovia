import { ForbiddenException, Type } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { AdminController } from './admin/admin.controller';
import { AssessmentController } from './assessment/assessment.controller';
import { CandidateController } from './candidate/candidate.controller';
import { CourseController } from './course/course.controller';
import { LeadController } from './lead/lead.controller';
import { SessionAuthGuard } from './auth/guards/session-auth.guard';

type Handler = (...args: unknown[]) => unknown;

const makeRequest = (role: string, id = 'user-1') => ({
  user: { id, email: 'user@example.test', name: 'Test User', role },
});
type Req = ReturnType<typeof makeRequest>;

// Accepts any service method name, so tests don't depend on service signatures.
function createServiceMock() {
  const fns: Record<string, jest.Mock> = {};
  const service = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (typeof prop !== 'string') return undefined;
        if (!fns[prop]) fns[prop] = jest.fn();
        return fns[prop];
      },
    },
  );
  return {
    service,
    fns,
    allCalls: () => Object.values(fns).flatMap((fn) => fn.mock.calls),
    anyCalled: () =>
      Object.values(fns).some((fn) => fn.mock.calls.length > 0),
  };
}

async function isForbidden(fn: () => unknown): Promise<boolean> {
  try {
    await fn();
    return false;
  } catch (error) {
    return error instanceof ForbiddenException;
  }
}

function callRoute(controller: object, name: string, args: unknown[]) {
  return (controller as unknown as Record<string, Handler>)[name](...args);
}

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
const nonAdminRoles = allRoles.filter((role) => !adminRoles.includes(role));

const validCourse = {
  title: 'Course',
  description: 'Description',
  duration: '4 weeks',
  level: 'beginner',
};

type RouteSpec = {
  name: string;
  kind: 'admin' | 'authenticated' | 'public' | 'always-forbidden';
  args: (request: Req) => unknown[];
};

type ControllerSpec = {
  label: string;
  controllerClass: Type<object>;
  routes: RouteSpec[];
};

const controllers: ControllerSpec[] = [
  {
    label: 'AdminController',
    controllerClass: AdminController,
    routes: [
      { name: 'getOverview', kind: 'admin', args: (r) => [r] },
      { name: 'getStudents', kind: 'admin', args: (r) => [r] },
      { name: 'getStudent', kind: 'admin', args: (r) => [r, 'student-1'] },
    ],
  },
  {
    label: 'CandidateController',
    controllerClass: CandidateController,
    routes: [
      { name: 'create', kind: 'admin', args: (r) => [r, {}] },
      { name: 'createForUser', kind: 'authenticated', args: (r) => [r, 'user-1', {}] },
      { name: 'findForUser', kind: 'authenticated', args: (r) => [r, 'user-1'] },
      { name: 'findAll', kind: 'admin', args: (r) => [r] },
      { name: 'findOne', kind: 'admin', args: (r) => [r, 'cand-1'] },
    ],
  },
  {
    label: 'CourseController',
    controllerClass: CourseController,
    routes: [
      { name: 'adminFindAll', kind: 'admin', args: (r) => [r] },
      { name: 'adminCreate', kind: 'admin', args: (r) => [r, validCourse] },
      { name: 'adminUpdate', kind: 'admin', args: (r) => [r, 'course-1', { title: 'Renamed' }] },
      { name: 'adminPublish', kind: 'admin', args: (r) => [r, 'course-1'] },
      { name: 'adminArchive', kind: 'admin', args: (r) => [r, 'course-1'] },
      { name: 'findAll', kind: 'authenticated', args: () => [] },
      { name: 'myEnrollments', kind: 'authenticated', args: (r) => [r] },
      { name: 'myProgress', kind: 'authenticated', args: (r) => [r] },
      { name: 'completeLesson', kind: 'authenticated', args: (r) => [r, 'lesson-1'] },
      { name: 'enroll', kind: 'authenticated', args: (r) => [r, 'course-1'] },
      { name: 'create', kind: 'admin', args: (r) => [r, validCourse] },
      { name: 'findOne', kind: 'authenticated', args: () => ['course-1'] },
    ],
  },
  {
    label: 'LeadController',
    controllerClass: LeadController,
    routes: [
      { name: 'create', kind: 'public', args: () => [{ name: 'Lead' }] },
      { name: 'convert', kind: 'admin', args: (r) => [r, 'lead-1', 'cand-1'] },
    ],
  },
  {
    label: 'AssessmentController',
    controllerClass: AssessmentController,
    routes: [
      { name: 'startInteractiveAssessment', kind: 'authenticated', args: (r) => [r] },
      { name: 'submitInteractiveAssessment', kind: 'authenticated', args: (r) => [r, 'a-1', { answers: [] }] },
      { name: 'createMyCareerReadiness', kind: 'authenticated', args: (r) => [r] },
      { name: 'findForCandidate', kind: 'authenticated', args: (r) => [r, 'cand-1'] },
      { name: 'findOne', kind: 'authenticated', args: (r) => [r, 'a-1'] },
      { name: 'submit', kind: 'always-forbidden', args: () => [] },
    ],
  },
];

const reflector = new Reflector();

function guardsFor(target: unknown): unknown[] {
  return (
    reflector.get<unknown[]>(GUARDS_METADATA, target as Type<object>) ?? []
  );
}

for (const spec of controllers) {
  describe(`${spec.label} authorization`, () => {
    it('has a test entry for every route handler', () => {
      const handlers = Object.getOwnPropertyNames(
        spec.controllerClass.prototype,
      ).filter(
        (name) =>
          name !== 'constructor' &&
          !name.startsWith('assert') &&
          name !== 'isAdmin',
      );
      expect([...handlers].sort()).toEqual(
        spec.routes.map((route) => route.name).sort(),
      );
    });

    for (const route of spec.routes) {
      describe(route.name, () => {
        const make = () => {
          const mock = createServiceMock();
          const controller = new spec.controllerClass(mock.service);
          return { mock, controller };
        };

        it(
          route.kind === 'public'
            ? 'is not behind SessionAuthGuard (public by design)'
            : 'is behind SessionAuthGuard',
          () => {
            const method = (
              spec.controllerClass.prototype as unknown as Record<string, unknown>
            )[route.name];
            const guards = [...guardsFor(spec.controllerClass), ...guardsFor(method)];
            expect(guards.includes(SessionAuthGuard)).toBe(
              route.kind !== 'public',
            );
          },
        );

        if (route.kind === 'admin') {
          it.each(nonAdminRoles)('forbids %s and never calls the service', async (role) => {
            const { mock, controller } = make();
            const request = makeRequest(role);
            expect(
              await isForbidden(() => callRoute(controller, route.name, route.args(request))),
            ).toBe(true);
            expect(mock.anyCalled()).toBe(false);
          });

          it.each(adminRoles)('does not forbid %s', async (role) => {
            const { controller } = make();
            const request = makeRequest(role);
            expect(
              await isForbidden(() => callRoute(controller, route.name, route.args(request))),
            ).toBe(false);
          });
        }

        if (route.kind === 'authenticated' || route.kind === 'public') {
          it.each(allRoles)('does not forbid %s', async (role) => {
            const { controller } = make();
            const request = makeRequest(role);
            expect(
              await isForbidden(() => callRoute(controller, route.name, route.args(request))),
            ).toBe(false);
          });
        }

        if (route.kind === 'always-forbidden') {
          it.each(allRoles)('forbids %s', async (role) => {
            const { controller } = make();
            const request = makeRequest(role);
            expect(
              await isForbidden(() => callRoute(controller, route.name, route.args(request))),
            ).toBe(true);
          });
        }
      });
    }
  });
}

describe('self-service routes use the session user, never a URL id', () => {
  it('candidate.findForUser takes no URL id and always uses the session user', async () => {
    const mock = createServiceMock();
    const controller = new CandidateController(mock.service as never);
    await controller.findForUser(makeRequest('STUDENT', 'student-1') as never);
    expect(mock.fns.findForUser).toHaveBeenCalledWith('student-1');
  });

  it('course.myEnrollments and myProgress use the session user', async () => {
    const mock = createServiceMock();
    const controller = new CourseController(mock.service as never);
    const request = makeRequest('STUDENT', 'student-1');
    await controller.myEnrollments(request as never);
    await controller.myProgress(request as never);
    expect(mock.fns.myEnrollments).toHaveBeenCalledWith('student-1');
    expect(mock.fns.myProgress).toHaveBeenCalledWith('student-1');
  });

  it('course.completeLesson and enroll act as the session user', async () => {
    const mock = createServiceMock();
    const controller = new CourseController(mock.service as never);
    const request = makeRequest('STUDENT', 'student-1');
    await controller.completeLesson(request as never, 'lesson-9');
    await controller.enroll(request as never, 'course-9');
    expect(mock.fns.completeLesson).toHaveBeenCalledWith('student-1', 'lesson-9');
    expect(mock.fns.enroll).toHaveBeenCalledWith('student-1', 'course-9');
  });

  it('assessment.findOne passes isAdmin=false for a student and true for an admin', async () => {
    const studentMock = createServiceMock();
    await new AssessmentController(studentMock.service as never).findOne(
      makeRequest('STUDENT', 'student-1') as never,
      'a-1',
    );
    expect(studentMock.fns.findOne).toHaveBeenCalledWith('a-1', 'student-1', false);

    const adminMock = createServiceMock();
    await new AssessmentController(adminMock.service as never).findOne(
      makeRequest('ADMIN', 'admin-1') as never,
      'a-1',
    );
    expect(adminMock.fns.findOne).toHaveBeenCalledWith('a-1', 'admin-1', true);
  });

  it('assessment.findForCandidate passes the session user and admin flag', async () => {
    const studentMock = createServiceMock();
    await new AssessmentController(studentMock.service as never).findForCandidate(
      makeRequest('STUDENT', 'student-1') as never,
      'cand-9',
    );
    expect(
      studentMock.allCalls().some((args) => args.slice(-2).join() === 'student-1,false'),
    ).toBe(true);

    const adminMock = createServiceMock();
    await new AssessmentController(adminMock.service as never).findForCandidate(
      makeRequest('ADMIN', 'admin-1') as never,
      'cand-9',
    );
    expect(
      adminMock.allCalls().some((args) => args.slice(-2).join() === 'admin-1,true'),
    ).toBe(true);
  });

  it('assessment.startInteractiveAssessment uses the session user', async () => {
    const mock = createServiceMock();
    await new AssessmentController(mock.service as never).startInteractiveAssessment(
      makeRequest('STUDENT', 'student-1') as never,
    );
    expect(mock.allCalls().some((args) => args.includes('student-1'))).toBe(true);
  });
});
