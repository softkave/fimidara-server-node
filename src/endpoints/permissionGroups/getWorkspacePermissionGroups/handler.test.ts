import {calculatePageSize, findItemWithField} from '../../../utils/fns';
import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertPermissionGroupListForTest} from '../../testUtils/generateData/permissionGroup';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getWorkspacePermissionGroups from './handler';
import {GetWorkspacePermissionGroupsEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('getWorkspacePermissionGroups', () => {
  test("workspace's permissionGroups returned", async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup01} = await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );
    const {permissionGroup: permissionGroup02} = await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );

    const instData = RequestData.fromExpressRequest<GetWorkspacePermissionGroupsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result = await getWorkspacePermissionGroups(context, instData);
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
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertPermissionGroupListForTest(context, 15, {
      workspaceId: workspace.resourceId,
    });
    const count = await context.semantic.permissionGroup.countByQuery({
      workspaceId: workspace.resourceId,
    });
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<GetWorkspacePermissionGroupsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    let result = await getWorkspacePermissionGroups(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.permissionGroups).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<GetWorkspacePermissionGroupsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    result = await getWorkspacePermissionGroups(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.permissionGroups).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
