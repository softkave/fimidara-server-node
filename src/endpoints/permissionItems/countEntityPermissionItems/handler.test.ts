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
import countEntityPermissionItems from './handler';
import {ICountEntityPermissionItemsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('countEntityPermissionItems', () => {
  test('count', async () => {
    assertContext(context);
    const {userToken, user} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertPermissionItemListForTest(context, 15, {
      workspaceId: workspace.resourceId,
      entityId: user.resourceId,
      entityType: AppResourceType.User,
    });
    const count = await context.semantic.permissionItem.countByQuery({
      workspaceId: workspace.resourceId,
      entityId: user.resourceId,
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
