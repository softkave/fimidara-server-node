import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../definitions/system.js';
import RequestData from '../../endpoints/RequestData.js';
import {generateAndInsertAgentTokenListForTest} from '../../endpoints/testUtils/generate/agentToken.js';
import {generateAndInsertUserListForTest} from '../../endpoints/testUtils/generate/user.js';
import {expectErrorThrown} from '../../endpoints/testUtils/helpers/error.js';
import {completeTests} from '../../endpoints/testUtils/helpers/testFns.js';
import {initTests} from '../../endpoints/testUtils/testUtils.js';
import {
  ChangePasswordError,
  PermissionDeniedError,
} from '../../endpoints/users/errors.js';
import {ServerError} from '../../utils/errors.js';
import {makeUserSessionAgent} from '../../utils/sessionUtils.js';
import {kUtilsInjectables} from '../injection/injectables.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('SessionContext', () => {
  test('getAgent fails if token does not contain scope', async () => {
    const [user] = await generateAndInsertUserListForTest(1);
    const [userAgentToken] = await generateAndInsertAgentTokenListForTest(1, {
      scope: [kTokenAccessScope.changePassword],
      workspaceId: null,
      forEntityId: user.resourceId,
      entityType: kFimidaraResourceType.User,
    });
    await expectErrorThrown(async () => {
      const reqData = new RequestData({
        agent: makeUserSessionAgent(user, userAgentToken),
      });
      await kUtilsInjectables
        .session()
        .getAgentFromReq(
          reqData,
          [kFimidaraResourceType.User],
          [kTokenAccessScope.login]
        );
    }, [PermissionDeniedError.name]);
  });

  test('getAgent fails if user requires password change', async () => {
    const [user] = await generateAndInsertUserListForTest(1, () => ({
      requiresPasswordChange: true,
    }));
    const [userAgentToken] = await generateAndInsertAgentTokenListForTest(1, {
      scope: [kTokenAccessScope.login],
      workspaceId: null,
      forEntityId: user.resourceId,
      entityType: kFimidaraResourceType.User,
    });
    await expectErrorThrown(async () => {
      const reqData = new RequestData({
        agent: makeUserSessionAgent(user, userAgentToken),
      });
      await kUtilsInjectables
        .session()
        .getAgentFromReq(
          reqData,
          [kFimidaraResourceType.User],
          [kTokenAccessScope.login]
        );
    }, [ChangePasswordError.name]);
  });

  test.each([true, false])(
    'encodeToken, shouldRefresh=%s',
    async shouldRefresh => {
      const token = await kUtilsInjectables.session().encodeToken({
        shouldRefresh,
        tokenId: 'tokenId',
        expiresAt: Date.now() + 10_000,
        issuedAt: Date.now(),
      });
      expect(token.jwtToken).toBeDefined();
      expect(token.jwtTokenExpiresAt).toBeDefined();

      if (shouldRefresh) {
        expect(token.refreshToken).toBeDefined();
      } else {
        expect(token.refreshToken).not.toBeDefined();
      }

      const decodedToken = kUtilsInjectables
        .session()
        .decodeToken(token.jwtToken);
      expect(decodedToken).toBeDefined();
      expect(decodedToken.exp).toBeDefined();
      expect(decodedToken.iat).toBeDefined();
      expect(decodedToken.sub.id).toBe('tokenId');

      if (shouldRefresh) {
        expect(decodedToken.sub.refreshToken).toBeDefined();
      } else {
        expect(decodedToken.sub.refreshToken).not.toBeDefined();
      }
    }
  );

  test('encodeToken fails if shouldRefresh is true but expires is not provided', async () => {
    await expect(async () => {
      await kUtilsInjectables
        .session()
        .encodeToken({tokenId: 'tokenId', shouldRefresh: true});
    }).rejects.toThrow(ServerError);
  });
});
