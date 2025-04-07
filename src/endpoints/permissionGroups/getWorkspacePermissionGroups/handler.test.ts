import {calculatePageSize} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {findItemWithField} from '../../../utils/fns.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertPermissionGroupListForTest} from '../../testHelpers/generate/permissionGroup.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
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
    const {permissionGroup: permissionGroup01} =
      await insertPermissionGroupForTest(userToken, workspace.resourceId);
    const {permissionGroup: permissionGroup02} =
      await insertPermissionGroupForTest(userToken, workspace.resourceId);

    const reqData =
      RequestData.fromExpressRequest<GetWorkspacePermissionGroupsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await getWorkspacePermissionGroups(reqData);
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
    const count = await kIjxSemantic.permissionGroup().countByQuery({
      workspaceId: workspace.resourceId,
    });
    const pageSize = 10;
    let page = 0;
    let reqData =
      RequestData.fromExpressRequest<GetWorkspacePermissionGroupsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {page, pageSize, workspaceId: workspace.resourceId}
      );
    let result = await getWorkspacePermissionGroups(reqData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.permissionGroups).toHaveLength(
      calculatePageSize(count, pageSize, page)
    );

    page = 1;
    reqData =
      RequestData.fromExpressRequest<GetWorkspacePermissionGroupsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {page, pageSize, workspaceId: workspace.resourceId}
      );
    result = await getWorkspacePermissionGroups(reqData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.permissionGroups).toHaveLength(
      calculatePageSize(count, pageSize, page)
    );
  });
});
