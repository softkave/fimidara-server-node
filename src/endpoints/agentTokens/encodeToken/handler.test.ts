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
import encodeAgentToken from './handler.js';
import {EncodeAgentTokenEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('encodeAgentToken', () => {
  test.each([true, false])(
    'token encoded, withRefresh=%s',
    async withRefresh => {
      const {userToken} = await insertUserForTest();
      const {workspace} = await insertWorkspaceForTest(userToken);
      const {token: token01} = await insertAgentTokenForTest(
        userToken,
        workspace.resourceId,
        {shouldRefresh: withRefresh}
      );

      const reqData =
        RequestData.fromExpressRequest<EncodeAgentTokenEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {tokenId: token01.resourceId, workspaceId: workspace.resourceId}
        );
      const result = await encodeAgentToken(reqData);
      assertEndpointResultOk(result);

      expect(result.jwtToken).toBeTruthy();

      if (withRefresh) {
        expect(result.refreshToken).toBeTruthy();
      } else {
        expect(result.refreshToken).not.toBeTruthy();
      }
    }
  );
});
