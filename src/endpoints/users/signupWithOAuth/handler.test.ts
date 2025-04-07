import assert from 'assert';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {DataQuery} from '../../../contexts/data/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../contexts/ijx/register.js';
import {
  EmailJobParams,
  Job,
  kEmailJobType,
  kJobType,
} from '../../../definitions/job.js';
import {UserWithWorkspace} from '../../../definitions/user.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {mergeData} from '../../../utils/fns.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  initTests,
  insertUserForTest,
  insertUserWithOAuthForTest,
} from '../../testHelpers/utils.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('signupWithOAuth', () => {
  test('user signup successful with token creation', async () => {
    const result = await insertUserWithOAuthForTest();

    const savedUser = await kIjxSemantic
      .user()
      .assertGetOneByQuery({resourceId: result.user.resourceId});
    expect(savedUser).toBeTruthy();
    expect(result.userToken).toBeTruthy();
    expect(result.token).toBeTruthy();
  });

  test('send email verification code if email is not verified', async () => {
    const {rawUser} = await insertUserWithOAuthForTest({
      userInput: {
        emailVerifiedAt: undefined,
      },
    });

    await kIjxUtils.promises().flush();
    const query: DataQuery<Job<EmailJobParams>> = {
      type: kJobType.email,
      params: {
        $objMatch: {
          type: kEmailJobType.confirmEmailAddress,
          emailAddress: {$all: [rawUser.email]},
          userId: {$all: [rawUser.resourceId]},
        },
      },
    };

    const dbJob = await kIjxSemantic.job().getOneByQuery(query);
    expect(dbJob).toBeTruthy();
  });

  test('new signups are waitlisted', async () => {
    kRegisterIjxUtils.suppliedConfig(
      mergeData(
        kIjxUtils.suppliedConfig(),
        {FLAG_waitlistNewSignups: true},
        {arrayUpdateStrategy: 'replace'}
      )
    );

    const result = await insertUserWithOAuthForTest();

    const savedUser = await kIjxSemantic
      .user()
      .assertGetOneByQuery({resourceId: result.user.resourceId});
    expect(savedUser.isOnWaitlist).toBeTruthy();

    // TODO: if we ever switch to concurrent tests, then create a context for
    // this test instead
    kRegisterIjxUtils.suppliedConfig(
      mergeData(
        kIjxUtils.suppliedConfig(),
        {FLAG_waitlistNewSignups: false},
        {arrayUpdateStrategy: 'replace'}
      )
    );
  });

  test('signup updates existing user', async () => {
    const {rawUser} = await insertUserForTest();

    const result = await insertUserWithOAuthForTest({
      userInput: {
        email: rawUser.email,
      },
    });

    const savedUser = await kIjxSemantic
      .user()
      .assertGetOneByQuery({resourceId: result.user.resourceId});
    expect(savedUser.isEmailVerified).toBeTruthy();
    expect(savedUser.oauthUserId).toBe(result.oauthUserId);
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
    'signup updates existing user',
    async ({userEmailVerified, emailVerifiedAt}) => {
      let rawUser: UserWithWorkspace | undefined;

      beforeAll(async () => {
        ({rawUser} = await insertUserForTest(
          /** userInput */ {},
          /** skipAutoVerifyEmail */ !userEmailVerified
        ));
      });

      test(`userEmailVerified=${userEmailVerified} with emailVerifiedAt=${emailVerifiedAt}`, async () => {
        assert(rawUser, 'rawUser is not defined');

        const result = await insertUserWithOAuthForTest({
          userInput: {
            email: rawUser.email,
            emailVerifiedAt,
          },
        });

        const savedUser = await kIjxSemantic
          .user()
          .assertGetOneByQuery({resourceId: result.user.resourceId});
        expect(savedUser.isEmailVerified).toBe(
          userEmailVerified || !!emailVerifiedAt
        );
        expect(savedUser.oauthUserId).toBe(result.oauthUserId);
      });
    }
  );
});
