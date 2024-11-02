import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import getWorkspaceEndpoint from './handler.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getWorkspace', () => {
  test('workspace returned', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const result = await getWorkspaceEndpoint(
      RequestData.fromExpressRequest(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      )
    );
    assertEndpointResultOk(result);
    expect(result.workspace).toMatchObject(workspace);
  });
});
