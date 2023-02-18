import {calculatePageSize, expectContainsEveryItemIn} from '../../../utils/fns';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertCollaborationRequestListForTest} from '../../test-utils/generate-data/collaborationRequest';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getWorkspaceCollaborationRequests from './handler';
import {IGetWorkspaceCollaborationRequestsEndpointParams} from './types';

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

describe('getWorkspaceRequests', () => {
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
      RequestData.fromExpressRequest<IGetWorkspaceCollaborationRequestsEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await getWorkspaceCollaborationRequests(context, instData);
    assertEndpointResultOk(result);
    expect(result.requests.length).toEqual(2);
    expectContainsEveryItemIn(result.requests, [request01, request02], item => item.resourceId);
  });

  test('pagination', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertCollaborationRequestListForTest(context, 15, () => ({
      workspaceId: workspace.resourceId,
    }));
    const count = await context.data.collaborationRequest.countByQuery({
      workspaceId: workspace.resourceId,
    });
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<IGetWorkspaceCollaborationRequestsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    let result = await getWorkspaceCollaborationRequests(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.requests).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<IGetWorkspaceCollaborationRequestsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    result = await getWorkspaceCollaborationRequests(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.requests).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
