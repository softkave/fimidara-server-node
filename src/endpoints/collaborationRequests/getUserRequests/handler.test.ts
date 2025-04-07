import {calculatePageSize} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {getResourceId} from '../../../utils/fns.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertCollaborationRequestListForTest} from '../../testHelpers/generate/collaborationRequest.js';
import {expectContainsEveryItemInForAnyType} from '../../testHelpers/helpers/assertion.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
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
    const reqData = RequestData.fromExpressRequest(
      mockExpressRequestWithAgentToken(user02Token),
      {}
    );
    const result = await getUserCollaborationRequests(reqData);
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
    const count = await kIjxSemantic.collaborationRequest().countByQuery({
      recipientEmail: user02.email,
    });
    const pageSize = 10;
    let page = 0;
    let reqData = RequestData.fromExpressRequest(
      mockExpressRequestWithAgentToken(user02Token),
      {
        pageSize,
      }
    );
    let result = await getUserCollaborationRequests(reqData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.requests).toHaveLength(
      calculatePageSize(count, pageSize, page)
    );

    page = 1;
    reqData = RequestData.fromExpressRequest(
      mockExpressRequestWithAgentToken(user02Token),
      {
        page,
        pageSize,
      }
    );
    result = await getUserCollaborationRequests(reqData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.requests).toHaveLength(
      calculatePageSize(count, pageSize, page)
    );
  });
});
