import {calculatePageSize, findItemWithField} from '../../../utils/fns.js';
import RequestData from '../../RequestData.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {generateAndInsertPermissionGroupListForTest} from '../../testUtils/generate/permissionGroup.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import getWorkspacePermissionGroups from './handler.js';
import {GetWorkspacePermissionGroupsEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getWorkspacePermissionGroups', () => {
  test("workspace's permissionGroups returned", async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {permissionGroup: permissionGroup01} = await insertPermissionGroupForTest(
      userToken,
      workspace.resourceId
    );
    const {permissionGroup: permissionGroup02} = await insertPermissionGroupForTest(
      userToken,
      workspace.resourceId
    );

    const instData =
      RequestData.fromExpressRequest<GetWorkspacePermissionGroupsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await getWorkspacePermissionGroups(instData);
    assertEndpointResultOk(result);
    const resultPermissionGroup01 = findItemWithField(
      result.permissionGroups,
      permissionGroup01.resourceId,
      'resourceId'
    );

    const resultPermissionGroup02 = findItemWithField(
      result.permissionGroups,
      permissionGroup02.resourceId,
      'resourceId'
    );
    expect(resultPermissionGroup01).toMatchObject(permissionGroup01);
    expect(resultPermissionGroup02).toMatchObject(permissionGroup02);
  });

  test('pagination', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await generateAndInsertPermissionGroupListForTest(15, {
      workspaceId: workspace.resourceId,
    });
    const count = await kSemanticModels.permissionGroup().countByQuery({
      workspaceId: workspace.resourceId,
    });
    const pageSize = 10;
    let page = 0;
    let instData =
      RequestData.fromExpressRequest<GetWorkspacePermissionGroupsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {page, pageSize, workspaceId: workspace.resourceId}
      );
    let result = await getWorkspacePermissionGroups(instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.permissionGroups).toHaveLength(
      calculatePageSize(count, pageSize, page)
    );

    page = 1;
    instData = RequestData.fromExpressRequest<GetWorkspacePermissionGroupsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    result = await getWorkspacePermissionGroups(instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.permissionGroups).toHaveLength(
      calculatePageSize(count, pageSize, page)
    );
  });
});
