import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
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
import countPermissionGroupsEndpoint from './handler.js';
import {CountPermissionGroupsEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('countPermissionGroups', () => {
  test('count', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await generateAndInsertPermissionGroupListForTest(15, {
      workspaceId: workspace.resourceId,
    });
    const count = await kSemanticModels.permissionGroup().countByQuery({
      workspaceId: workspace.resourceId,
    });
    const reqData =
      RequestData.fromExpressRequest<CountPermissionGroupsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await countPermissionGroupsEndpoint(reqData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
