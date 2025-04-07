import {afterAll, beforeAll, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {
  DeleteResourceJobParams,
  Job,
  kJobType,
} from '../../../definitions/job.js';
import {PermissionGroupMatcher} from '../../../definitions/permissionGroups.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import deletePermissionGroup from './handler.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('permissionGroup permission group deleted', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {permissionGroup} = await insertPermissionGroupForTest(
    userToken,
    workspace.resourceId
  );
  const reqData = RequestData.fromExpressRequest<PermissionGroupMatcher>(
    mockExpressRequestWithAgentToken(userToken),
    {permissionGroupId: permissionGroup.resourceId}
  );
  const result = await deletePermissionGroup(reqData);
  assertEndpointResultOk(result);

  appAssert(result.jobId);
  const job = (await kIjxSemantic.job().getOneByQuery({
    type: kJobType.deleteResource,
    resourceId: result.jobId,
    params: {
      $objMatch: {type: kFimidaraResourceType.PermissionGroup},
    },
  })) as Job<DeleteResourceJobParams>;
  expect(job).toBeTruthy();
  expect(job?.params).toMatchObject({
    resourceId: permissionGroup.resourceId,
    workspaceId: workspace.resourceId,
  });

  const dbItem = await kIjxSemantic
    .permissionGroup()
    .getOneByQuery({resourceId: permissionGroup.resourceId, isDeleted: true});
  expect(dbItem).toBeTruthy();
});
