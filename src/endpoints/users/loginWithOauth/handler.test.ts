import assert from 'assert';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {UserWithWorkspace} from '../../../definitions/user.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserWithOAuthForTest,
  mockExpressRequest,
} from '../../testUtils/testUtils.js';
import login from './handler.js';
import {LoginWithOAuthEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('loginWithOAuth', () => {
  test('user login successful with token reuse', async () => {
    const {user, userToken, oauthUserId} = await insertUserWithOAuthForTest();

    const reqData =
      RequestData.fromExpressRequest<LoginWithOAuthEndpointParams>(
        mockExpressRequest(),
        {oauthUserId}
      );

    const result = await login(reqData);
    assertEndpointResultOk(result);

    expect(result.user).toMatchObject(user);
    expect(result.jwtToken).toBeTruthy();
    expect(result.clientJwtToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.jwtTokenExpiresAt).toBeTruthy();

    const jwtToken = kUtilsInjectables.session().decodeToken(result.jwtToken);
    expect(jwtToken.sub.id).toBe(userToken.resourceId);
  });

  describe.each([
    {
      userEmailVerified: false,
      emailVerifiedAt: undefined,
    },
    {
      userEmailVerified: true,
      emailVerifiedAt: undefined,
    },
    {
      userEmailVerified: true,
      emailVerifiedAt: getTimestamp(),
    },
    {
      userEmailVerified: false,
      emailVerifiedAt: getTimestamp(),
    },
  ])(
    'login updates existing user',
    async ({userEmailVerified, emailVerifiedAt}) => {
      let rawUser: UserWithWorkspace | undefined;
      let oauthUserId: string;

      beforeAll(async () => {
        ({rawUser, oauthUserId} = await insertUserWithOAuthForTest({
          userInput: {
            emailVerifiedAt,
          },
        }));
      });

      test(`userEmailVerified=${userEmailVerified} with emailVerifiedAt=${emailVerifiedAt}`, async () => {
        assert(rawUser, 'rawUser is not defined');
        assert(oauthUserId, 'oauthUserId is not defined');

        const reqData =
          RequestData.fromExpressRequest<LoginWithOAuthEndpointParams>(
            mockExpressRequest(),
            {oauthUserId}
          );
        const result = await login(reqData);
        assertEndpointResultOk(result);

        const savedUser = await kSemanticModels
          .user()
          .assertGetOneByQuery({resourceId: result.user.resourceId});
        expect(savedUser.isEmailVerified).toBe(
          userEmailVerified || !!emailVerifiedAt
        );
        expect(savedUser.oauthUserId).toBe(oauthUserId);
      });
    }
  );
});
