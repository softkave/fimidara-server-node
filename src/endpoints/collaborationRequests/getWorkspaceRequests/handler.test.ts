import {calculatePageSize} from '../../../utils/fns';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {generateAndInsertCollaborationRequestListForTest} from '../../testUtils/generate/collaborationRequest';
import {expectContainsEveryItemIn} from '../../testUtils/helpers/assertion';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getWorkspaceCollaborationRequests from './handler';
import {GetWorkspaceCollaborationRequestsEndpointParams} from './types';

/**
 * TODO:
 * - Confirm that all the requests returned belong to the workspace
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getWorkspaceRequests', () => {
  test('workspace collaboration requests returned', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {request: request01} = await insertRequestForTest(
      userToken,
      workspace.resourceId
    );
    const {request: request02} = await insertRequestForTest(
      userToken,
      workspace.resourceId
    );
    const instData =
      RequestData.fromExpressRequest<GetWorkspaceCollaborationRequestsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await getWorkspaceCollaborationRequests(instData);
    assertEndpointResultOk(result);
    expect(result.requests.length).toEqual(2);
    expectContainsEveryItemIn(
      result.requests,
      [request01, request02],
      item => item.resourceId
    );
  });

  test('pagination', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await generateAndInsertCollaborationRequestListForTest(15, () => ({
      workspaceId: workspace.resourceId,
    }));
    const count = await kSemanticModels.collaborationRequest().countByQuery({
      workspaceId: workspace.resourceId,
    });
    const pageSize = 10;
    let page = 0;
    let instData =
      RequestData.fromExpressRequest<GetWorkspaceCollaborationRequestsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {page, pageSize, workspaceId: workspace.resourceId}
      );
    let result = await getWorkspaceCollaborationRequests(instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.requests).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData =
      RequestData.fromExpressRequest<GetWorkspaceCollaborationRequestsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {page, pageSize, workspaceId: workspace.resourceId}
      );
    result = await getWorkspaceCollaborationRequests(instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.requests).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
