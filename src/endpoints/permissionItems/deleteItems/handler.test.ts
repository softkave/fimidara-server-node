import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {kAppResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injectables';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertPermissionGroupForTest,
  insertPermissionItemsForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deletePermissionItems from './handler';
import {DeletePermissionItemsEndpointParams} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('permission items deleted', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {permissionGroup} = await insertPermissionGroupForTest(
    userToken,
    workspace.resourceId
  );
  await insertPermissionItemsForTest(userToken, workspace.resourceId, {
    entityId: permissionGroup.resourceId,
    target: {targetId: workspace.resourceId},
    access: true,
    action: 'readFile',
  });
  const instData = RequestData.fromExpressRequest<DeletePermissionItemsEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      workspaceId: workspace.resourceId,
      items: [{action: 'readFile', target: {targetId: workspace.resourceId}}],
    }
  );
  const result = await deletePermissionItems(instData);
  assertEndpointResultOk(result);

  appAssert(result.jobId);
  const job = await kSemanticModels.job().getOneByQuery<Job<DeleteResourceJobParams>>({
    type: kJobType.deleteResource,
    resourceId: result.jobId,
    params: {
      $objMatch: {
        type: kAppResourceType.PermissionItem,
        args: {resourceId: user.resourceId, workspaceId: workspace.resourceId},
      },
    },
  });
  expect(job).toBeTruthy();
  expect(job?.params.args).toMatchObject({
    resourceId: workspace.resourceId,
    workspaceId: workspace.resourceId,
  });
});
