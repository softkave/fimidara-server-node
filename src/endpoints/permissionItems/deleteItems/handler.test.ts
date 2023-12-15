import assert from 'assert';
import {AppResourceTypeMap} from '../../../definitions/system';
import RequestData from '../../RequestData';
import {executeJob, waitForJob} from '../../jobs/runner';
import {expectEntityHasPermissionsTargetingType} from '../../testUtils/helpers/permissionItem';
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
  assert(result.jobId);
  await executeJob(result.jobId);
  await waitForJob(result.jobId);
  await expectEntityHasPermissionsTargetingType(
    permissionGroup.resourceId,
    'readFile',
    workspace.resourceId,
    AppResourceTypeMap.File,
    /** expected result */ false
  );
});
