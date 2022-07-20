import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getWorkspaceRequests from './handler';
import {IGetWorkspaceRequestsEndpointParams} from './types';

/**
 * TODO:
 * - Confirm that all the requests returned belong to the workspace
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('workspace collaboration requests returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {request: request01} = await insertRequestForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const {request: request02} = await insertRequestForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const instData =
    RequestData.fromExpressRequest<IGetWorkspaceRequestsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId: workspace.resourceId,
      }
    );

  const result = await getWorkspaceRequests(context, instData);
  assertEndpointResultOk(result);
  expect(result.requests.length).toEqual(2);
  expect(result.requests).toContainEqual(request01);
  expect(result.requests).toContainEqual(request02);
});
