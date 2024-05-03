import {Job, EmailJobParams, kJobType, kEmailJobType} from '../../../definitions/job.js';
import RequestData from '../../RequestData.js';
import {DataQuery} from '../../contexts/data/types.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {test, beforeAll, afterAll, expect} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import sendEmailVerificationCode from './handler.js';

/**
 * TODO:
 * - test that function fails if email is verified already
 * - that email has verification link
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('sendEmailVerificationCode', async () => {
  const {user, userToken} = await insertUserForTest(
    /**userInput */ {},
    /**skipAutoVerifyEmail */ true
  );
  await kSemanticModels.utils().withTxn(opts => {
    return kSemanticModels
      .user()
      .getAndUpdateOneById(user.resourceId, {emailVerificationEmailSentAt: null}, opts);
  }, /** reuseTxn */ true);
  const result = await sendEmailVerificationCode(
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken))
  );
  assertEndpointResultOk(result);

  await kUtilsInjectables.promises().flush();
  // const query: DataQuery<EmailMessage> = {
  //   type: kEmailMessageType.confirmEmailAddress,
  //   emailAddress: {$all: [user.email]},
  //   userId: {$all: [user.resourceId]},
  // };
  // const dbEmailMessage = await kSemanticModels.emailMessage().getOneByQuery(query);
  // expect(dbEmailMessage).toBeTruthy();

  const query: DataQuery<Job<EmailJobParams>> = {
    type: kJobType.email,
    params: {
      $objMatch: {
        type: kEmailJobType.confirmEmailAddress,
        emailAddress: {$all: [user.email]},
        userId: {$all: [user.resourceId]},
      },
    },
  };
  const dbJob = await kSemanticModels.job().getOneByQuery(query);
  expect(dbJob).toBeTruthy();
});
