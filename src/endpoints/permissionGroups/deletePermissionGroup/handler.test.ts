import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job.js';
import {PermissionGroupMatcher} from '../../../definitions/permissionGroups.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import RequestData from '../../RequestData.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {test, beforeAll, afterAll, expect} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
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
  const instData = RequestData.fromExpressRequest<PermissionGroupMatcher>(
    mockExpressRequestWithAgentToken(userToken),
    {permissionGroupId: permissionGroup.resourceId}
  );
  const result = await deletePermissionGroup(instData);
  assertEndpointResultOk(result);

  appAssert(result.jobId);
  const job = (await kSemanticModels.job().getOneByQuery({
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

  const dbItem = await kSemanticModels
    .permissionGroup()
    .getOneByQuery({resourceId: permissionGroup.resourceId, isDeleted: true});
  expect(dbItem).toBeTruthy();
});
