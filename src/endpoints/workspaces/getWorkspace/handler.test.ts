import RequestData from '../../RequestData.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {test, beforeAll, afterAll, expect} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import getWorkspace from './handler.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('workspace returned', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const result = await getWorkspace(
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
      workspaceId: workspace.resourceId,
    })
  );
  assertEndpointResultOk(result);
  expect(result.workspace).toMatchObject(workspace);
});
