import { ForbiddenException } from '@nestjs/common';
import { PlacementController } from './placement.controller';
import { PlacementService } from './placement.service';

const placementService = {
  overview: jest.fn(),
  listApplications: jest.fn(),
  getApplication: jest.fn(),
  createApplication: jest.fn(),
  updateApplication: jest.fn(),
  createInterview: jest.fn(),
  updateInterview: jest.fn(),
  createOffer: jest.fn(),
  updateOffer: jest.fn(),
  updateApplicationPipeline: jest.fn(),
  getReadinessCandidates: jest.fn(),
  getCandidateReadiness: jest.fn(),
  reviewCandidateReadiness: jest.fn(),
  listCandidateMocks: jest.fn(),
  scheduleMockInterview: jest.fn(),
  recordMockInterviewOutcome: jest.fn(),
};

type RouteName = keyof typeof placementService;

const makeRequest = (role: string) => ({
  user: {
    id: 'user-1',
    email: 'user@example.test',
    name: 'Test User',
    role,
  },
});
type TestRequest = ReturnType<typeof makeRequest>;

// Every route handler on PlacementController must appear here.
const routes: Array<{
  name: RouteName;
  call: (c: PlacementController, r: TestRequest) => unknown;
}> = [
  { name: 'overview', call: (c, r) => c.overview(r) },
  { name: 'listApplications', call: (c, r) => c.listApplications(r) },
  { name: 'getApplication', call: (c, r) => c.getApplication(r, 'app-1') },
  { name: 'createApplication', call: (c, r) => c.createApplication(r, {}) },
  { name: 'updateApplication', call: (c, r) => c.updateApplication(r, 'app-1', {}) },
  { name: 'createInterview', call: (c, r) => c.createInterview(r, 'app-1', {}) },
  { name: 'updateInterview', call: (c, r) => c.updateInterview(r, 'int-1', {}) },
  { name: 'createOffer', call: (c, r) => c.createOffer(r, 'app-1', {}) },
  { name: 'updateOffer', call: (c, r) => c.updateOffer(r, 'offer-1', {}) },
  {
    name: 'updateApplicationPipeline',
    call: (c, r) => c.updateApplicationPipeline(r, 'app-1', {}),
  },
  { name: 'getReadinessCandidates', call: (c, r) => c.getReadinessCandidates(r) },
  {
    name: 'getCandidateReadiness',
    call: (c, r) => c.getCandidateReadiness(r, 'cand-1'),
  },
  {
    name: 'reviewCandidateReadiness',
    call: (c, r) => c.reviewCandidateReadiness(r, 'cand-1', {}),
  },
  {
    name: 'listCandidateMocks',
    call: (c, r) => c.listCandidateMocks(r, 'cand-1'),
  },
  {
    name: 'scheduleMockInterview',
    call: (c, r) => c.scheduleMockInterview(r, 'cand-1', {}),
  },
  {
    name: 'recordMockInterviewOutcome',
    call: (c, r) => c.recordMockInterviewOutcome(r, 'mock-1', {}),
  },
];

const deniedRoles = [
  'STUDENT',
  'TRAINER',
  'COUNSELLOR',
  'SUPPORT_STAFF',
  'RECRUITER',
];
const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'PLACEMENT_MANAGER'];

describe('PlacementController route authorization', () => {
  let controller: PlacementController;

  beforeEach(() => {
    controller = new PlacementController(
      placementService as unknown as PlacementService,
    );
  });

  it('covers every route handler on the controller', () => {
    const handlerNames = Object.getOwnPropertyNames(
      PlacementController.prototype,
    ).filter((name) => name !== 'constructor' && !name.startsWith('assert'));

    expect([...handlerNames].sort()).toEqual(
      routes.map((route) => route.name).sort(),
    );
  });

  describe.each(routes)('$name', (route) => {
    it.each(deniedRoles)('forbids %s and never calls the service', (role) => {
      expect(() => route.call(controller, makeRequest(role))).toThrow(
        ForbiddenException,
      );
      expect(placementService[route.name]).not.toHaveBeenCalled();
    });

    it.each(allowedRoles)('allows %s', (role) => {
      route.call(controller, makeRequest(role));
      expect(placementService[route.name]).toHaveBeenCalledTimes(1);
    });
  });

  it('attributes a readiness review to the reviewing user', () => {
    controller.reviewCandidateReadiness(
      makeRequest('ADMIN'),
      'cand-1',
      { decision: 'APPROVED' },
    );

    expect(placementService.reviewCandidateReadiness).toHaveBeenCalledWith(
      'cand-1',
      { decision: 'APPROVED' },
      'user-1',
    );
  });
});
