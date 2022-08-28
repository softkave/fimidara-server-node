import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getRequestWorkspace, {requestWorkspaceExtractor} from './handler';
import {IGetRequestWorkspaceEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('request workspace returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const instData =
    RequestData.fromExpressRequest<IGetRequestWorkspaceEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId: workspace.resourceId,
      }
    );

  const result = await getRequestWorkspace(context, instData);
  assertEndpointResultOk(result);

  const requestWorkspace = requestWorkspaceExtractor(workspace);
  expect(result.workspace).toEqual(requestWorkspace);
});
