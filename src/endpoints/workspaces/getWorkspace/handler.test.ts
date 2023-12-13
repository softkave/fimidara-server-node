import RequestData from '../../RequestData';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getWorkspace from './handler';

beforeAll(async () => {
  await initTest();
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
