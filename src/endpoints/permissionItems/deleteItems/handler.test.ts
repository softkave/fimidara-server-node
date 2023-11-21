import assert from 'assert';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import {executeJob, waitForJob} from '../../jobs/runner';
import {expectEntityHasPermissionsTargetingType} from '../../testUtils/helpers/permissionItem';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertPermissionItemsForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deletePermissionItems from './handler';
import {DeletePermissionItemsEndpointParams} from './types';
import {AppResourceTypeMap} from '../../../definitions/system';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('permission items deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {permissionGroup} = await insertPermissionGroupForTest(
    context,
    userToken,
    workspace.resourceId
  );
  await insertPermissionItemsForTest(context, userToken, workspace.resourceId, {
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
  const result = await deletePermissionItems(context, instData);
  assertEndpointResultOk(result);
  assert(result.jobId);
  await executeJob(context, result.jobId);
  await waitForJob(context, result.jobId);
  await expectEntityHasPermissionsTargetingType(
    context,
    permissionGroup.resourceId,
    'readFile',
    workspace.resourceId,
    AppResourceTypeMap.File,
    /** expected result */ false
  );
});
