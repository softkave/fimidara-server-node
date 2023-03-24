import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generateData/permissionItem';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {default as countResourcePermissionItems} from './handler';
import {ICountResourcePermissionItemsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
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
    });
    const count = await context.semantic.permissionItem.countByQuery({
      workspaceId: workspace.resourceId,
      containerId: workspace.resourceId,
      containerType: AppResourceType.Workspace,
      targetType: AppResourceType.Workspace,
      targetId: workspace.resourceId,
    });
    const instData = RequestData.fromExpressRequest<ICountResourcePermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        workspaceId: workspace.resourceId,
        targetType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
      }
    );
    const result = await countResourcePermissionItems(context, instData);
    assertEndpointResultOk(result);
    expect(result.count).toBeGreaterThanOrEqual(count);
  });
});
