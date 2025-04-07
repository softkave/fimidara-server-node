import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertAgentTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import getAgentToken from './handler.js';
import {GetAgentTokenEndpointParams} from './types.js';

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

describe('getAgentToken', () => {
  test('referenced agent token returned', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {token: token01} = await insertAgentTokenForTest(
      userToken,
      workspace.resourceId
    );

    const reqData = RequestData.fromExpressRequest<GetAgentTokenEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {tokenId: token01.resourceId, workspaceId: workspace.resourceId}
    );
    const result = await getAgentToken(reqData);
    assertEndpointResultOk(result);

    expect(result.token).toEqual(token01);
  });
});
