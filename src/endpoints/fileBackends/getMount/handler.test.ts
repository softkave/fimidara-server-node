import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertFileBackendMountForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithFileBackendMount,
} from '../../testUtils/testUtils';
import getFileBackendMount from './handler';
import {GetFileBackendMountEndpointParams} from './types';

/**
 * TODO:
 * - [Low] Check that onReferenced feature works
 */

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
});

test('referenced agent token returned', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {token: token01} = await insertFileBackendMountForTest(
    userToken,
    workspace.resourceId
  );

  const instData = RequestData.fromExpressRequest<GetFileBackendMountEndpointParams>(
    mockExpressRequestWithFileBackendMount(userToken),
    {tokenId: token01.resourceId, workspaceId: workspace.resourceId}
  );
  const result = await getFileBackendMount(instData);
  assertEndpointResultOk(result);
  expect(result.token).toEqual(token01);
});
