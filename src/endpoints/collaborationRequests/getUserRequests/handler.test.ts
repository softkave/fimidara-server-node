import {calculatePageSize, getResourceId} from '../../../utils/fns.js';
import RequestData from '../../RequestData.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {generateAndInsertCollaborationRequestListForTest} from '../../testUtils/generate/collaborationRequest.js';
import {expectContainsEveryItemInForAnyType} from '../../testUtils/helpers/assertion.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {test, expect, beforeAll, afterAll, describe} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import getUserCollaborationRequests from './handler.js';

/**
 * TODO:
 * - Confirm that all the requests returned belong to the user
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getUserRequests', () => {
  test("user's collaboration request returned", async () => {
    const {userToken} = await insertUserForTest();
    const {user: user02, userToken: user02Token} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {request: request01} = await insertRequestForTest(
      userToken,
      workspace.resourceId,
      {recipientEmail: user02.email}
    );
    const instData = RequestData.fromExpressRequest(
      mockExpressRequestWithAgentToken(user02Token),
      {}
    );
    const result = await getUserCollaborationRequests(instData);
    assertEndpointResultOk(result);
    expect(result.requests.length).toEqual(1);
    expectContainsEveryItemInForAnyType(
      result.requests,
      [request01],
      getResourceId,
      getResourceId
    );
  });

  test('pagination', async () => {
    const {user: user02, userToken: user02Token} = await insertUserForTest();
    await generateAndInsertCollaborationRequestListForTest(15, () => ({
      recipientEmail: user02.email,
    }));
    const count = await kSemanticModels.collaborationRequest().countByQuery({
      recipientEmail: user02.email,
    });
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest(
      mockExpressRequestWithAgentToken(user02Token),
      {
        pageSize,
      }
    );
    let result = await getUserCollaborationRequests(instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.requests).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest(
      mockExpressRequestWithAgentToken(user02Token),
      {
        page,
        pageSize,
      }
    );
    result = await getUserCollaborationRequests(instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.requests).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
