import {EmailJobParams, Job, kEmailJobType, kJobType} from '../../../definitions/job';
import RequestData from '../../RequestData';
import {DataQuery} from '../../contexts/data/types';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import sendEmailVerificationCode from './handler';

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
