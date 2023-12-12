import {AppResourceTypeMap} from '../../../definitions/system';
import RequestData from '../../RequestData';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generateData/permissionItem';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countEntityPermissionItems from './handler';
import {CountEntityPermissionItemsEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest();
});

describe.skip('countEntityPermissionItems', () => {
  test('count', async () => {
    const {userToken, user} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await generateAndInsertPermissionItemListForTest(15, {
      workspaceId: workspace.resourceId,
      entityId: user.resourceId,
      entityType: AppResourceTypeMap.User,
    });
    const count = await kSemanticModels.permissionItem().countByQuery({
      workspaceId: workspace.resourceId,
      entityId: user.resourceId,
    });
    const instData =
      RequestData.fromExpressRequest<CountEntityPermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId, entityId: user.resourceId}
      );
    const result = await countEntityPermissionItems(instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
