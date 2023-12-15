import {AppResourceTypeMap} from '../../../definitions/system';
import {calculatePageSize} from '../../../utils/fns';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injectables';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generateData/permissionItem';
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
import getEntityPermissionItems from './handler';
import {GetEntityPermissionItemsEndpointParams} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe.skip('getEntityPermissionitems', () => {
  test('entity permission items returned', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
      userToken,
      workspace.resourceId
    );
    await insertPermissionItemsForTest(userToken, workspace.resourceId, [
      {
        entityId: permissionGroup.resourceId,
        target: {targetId: workspace.resourceId},
        access: true,
        action: 'readFile',
      },
    ]);

    const instData =
      RequestData.fromExpressRequest<GetEntityPermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          workspaceId: workspace.resourceId,
          entityId: permissionGroup.resourceId,
        }
      );
    const result = await getEntityPermissionItems(instData);
    assertEndpointResultOk(result);

    throw new Error('Check that permissions belong to entity');
  });

  test('pagination', async () => {
    const {userToken, user} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await generateAndInsertPermissionItemListForTest(15, {
      workspaceId: workspace.resourceId,
      entityId: user.resourceId,
      entityType: AppResourceTypeMap.User,
      targetId: workspace.resourceId,
    });
    const count = await kSemanticModels.permissionItem().countByQuery({
      workspaceId: workspace.resourceId,
      entityId: user.resourceId,
      targetId: workspace.resourceId,
    });
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<GetEntityPermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        page,
        pageSize,
        workspaceId: workspace.resourceId,
        entityId: user.resourceId,
      }
    );
    let result = await getEntityPermissionItems(instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.items).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<GetEntityPermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        page,
        pageSize,
        workspaceId: workspace.resourceId,
        entityId: user.resourceId,
      }
    );
    result = await getEntityPermissionItems(instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.items).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
