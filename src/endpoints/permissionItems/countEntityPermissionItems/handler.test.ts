import {kAppResourceType} from '../../../definitions/system';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injectables';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generate/permissionItem';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countEntityPermissionItems from './handler';
import {CountEntityPermissionItemsEndpointParams} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe.skip('countEntityPermissionItems', () => {
  test('count', async () => {
    const {userToken, user} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await generateAndInsertPermissionItemListForTest(15, {
      workspaceId: workspace.resourceId,
      entityId: user.resourceId,
      entityType: kAppResourceType.User,
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
