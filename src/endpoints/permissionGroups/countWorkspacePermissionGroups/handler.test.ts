import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertPermissionGroupListForTest} from '../../testUtils/generate/permissionGroup.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import countWorkspacePermissionGroups from './handler.js';
import {CountWorkspacePermissionGroupsEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('countWorkspacePermissionGroups', () => {
  test('count', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await generateAndInsertPermissionGroupListForTest(15, {
      workspaceId: workspace.resourceId,
    });
    const count = await kIjxSemantic.permissionGroup().countByQuery({
      workspaceId: workspace.resourceId,
    });
    const reqData =
      RequestData.fromExpressRequest<CountWorkspacePermissionGroupsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await countWorkspacePermissionGroups(reqData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
