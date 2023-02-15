import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertPermissionItemListForTest} from '../../test-utils/generate-data/permissionItem';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {default as countResourcePermissionItems} from './handler';
import {ICountResourcePermissionItemsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('countResourcePermissionItems', () => {
  test('count', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertPermissionItemListForTest(context, 15, {
      workspaceId: workspace.resourceId,
      containerId: workspace.resourceId,
      containerType: AppResourceType.Workspace,
      targetType: AppResourceType.Workspace,
      targetId: workspace.resourceId,
      appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
    });
    const count = await context.data.permissionItem.countByQuery({
      workspaceId: workspace.resourceId,
      containerId: workspace.resourceId,
      containerType: AppResourceType.Workspace,
      targetType: AppResourceType.Workspace,
      targetId: workspace.resourceId,
      appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
    });
    const instData = RequestData.fromExpressRequest<ICountResourcePermissionItemsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId: workspace.resourceId,
        targetType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
      }
    );
    const result = await countResourcePermissionItems(context, instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
