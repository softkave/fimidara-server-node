import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppActionType, AppResourceType} from '../../../definitions/system';
import {BaseContextType} from '../../contexts/types';
import {executeJob, waitForJob} from '../../jobs/runner';
import RequestData from '../../RequestData';
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
    entity: {entityId: permissionGroup.resourceId},
    target: {targetType: AppResourceType.File, targetId: workspace.resourceId},
    grantAccess: true,
    action: AppActionType.Read,
    appliesTo: PermissionItemAppliesTo.ChildrenOfType,
  });
  const instData = RequestData.fromExpressRequest<DeletePermissionItemsEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      workspaceId: workspace.resourceId,
      entity: {entityId: permissionGroup.resourceId},
      items: [{target: {targetType: AppResourceType.File}}],
    }
  );
  const result = await deletePermissionItems(context, instData);
  assertEndpointResultOk(result);
  await executeJob(context, result.jobId);
  await waitForJob(context, result.jobId);
  await expectEntityHasPermissionsTargetingType(
    context,
    permissionGroup.resourceId,
    AppActionType.Read,
    workspace.resourceId,
    AppResourceType.File,
    /** expected result */ false
  );
});
