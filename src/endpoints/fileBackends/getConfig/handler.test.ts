import RequestData from '../../RequestData';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertFileBackendConfigForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithFileBackendConfig,
} from '../../testUtils/testUtils';
import getFileBackendConfig from './handler';
import {GetFileBackendConfigEndpointParams} from './types';

/**
 * TODO:
 * - [Low] Check that onReferenced feature works
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('referenced agent token returned', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {token: token01} = await insertFileBackendConfigForTest(
    userToken,
    workspace.resourceId
  );

  const instData = RequestData.fromExpressRequest<GetFileBackendConfigEndpointParams>(
    mockExpressRequestWithFileBackendConfig(userToken),
    {tokenId: token01.resourceId, workspaceId: workspace.resourceId}
  );
  const result = await getFileBackendConfig(instData);
  assertEndpointResultOk(result);
  expect(result.token).toEqual(token01);
});
