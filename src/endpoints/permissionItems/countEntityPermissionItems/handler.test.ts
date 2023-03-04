import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generateData/permissionItem';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countEntityPermissionItems from './handler';
import {ICountEntityPermissionItemsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('countEntityPermissionItems', () => {
  test('count', async () => {
    assertContext(context);
    const {userToken, user} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertPermissionItemListForTest(context, 15, {
      workspaceId: workspace.resourceId,
      containerId: workspace.resourceId,
      containerType: AppResourceType.Workspace,
      entityId: user.resourceId,
      entityType: AppResourceType.User,
    });
    const count = await context.data.permissionItem.countByQuery({
      workspaceId: workspace.resourceId,
      containerId: workspace.resourceId,
      containerType: AppResourceType.Workspace,
      entityId: user.resourceId,
      permissionEntityType: AppResourceType.User,
    });

    const instData = RequestData.fromExpressRequest<ICountEntityPermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        workspaceId: workspace.resourceId,
        entityId: user.resourceId,
      }
    );
    const result = await countEntityPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
