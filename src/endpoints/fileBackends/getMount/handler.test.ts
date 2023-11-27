import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
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

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('referenced agent token returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {token: token01} = await insertFileBackendMountForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const instData = RequestData.fromExpressRequest<GetFileBackendMountEndpointParams>(
    mockExpressRequestWithFileBackendMount(userToken),
    {tokenId: token01.resourceId, workspaceId: workspace.resourceId}
  );
  const result = await getFileBackendMount(context, instData);
  assertEndpointResultOk(result);
  expect(result.token).toEqual(token01);
});
