import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {DataQuery} from '../../../contexts/data/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../contexts/ijx/register.js';
import {
  EmailJobParams,
  Job,
  kEmailJobType,
  kJobType,
} from '../../../definitions/job.js';
import RequestData from '../../RequestData.js';
import MockTestEmailProviderContext from '../../testHelpers/context/email/MockTestEmailProviderContext.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequest,
} from '../../testHelpers/utils.js';
import forgotPassword from './handler.js';
import {ForgotPasswordEndpointParams} from './types.js';

/**
 * TODO:
 * - test that forgot password fails if email does not exist
 * - that email has verification link
 */

beforeEach(async () => {
  await initTests();
});

afterEach(async () => {
  await completeTests();
});

describe('forgotPassword', () => {
  test('forgot password with email sent', async () => {
    kRegisterIjxUtils.email(new MockTestEmailProviderContext());

    const {user} = await insertUserForTest();
    const reqData =
      RequestData.fromExpressRequest<ForgotPasswordEndpointParams>(
        mockExpressRequest(),
        {email: user.email}
      );
    const result = await forgotPassword(reqData);
    assertEndpointResultOk(result);

    await kIjxUtils.promises().flush();
    // const query: DataQuery<EmailMessage> = {
    //   type: kEmailMessageType.forgotPassword,
    //   emailAddress: {$all: [user.email]},
    //   userId: {$all: [user.resourceId]},
    // };
    // const dbEmailMessage = await kSemanticModels.emailMessage().getOneByQuery(query);
    // expect(dbEmailMessage).toBeTruthy();

    const query: DataQuery<Job<EmailJobParams>> = {
      type: kJobType.email,
      params: {
        $objMatch: {
          type: kEmailJobType.forgotPassword,
          emailAddress: {$all: [user.email]},
          userId: {$all: [user.resourceId]},
        },
      },
    };
    const dbJob = await kIjxSemantic.job().getOneByQuery(query);
    expect(dbJob).toBeTruthy();
  });
});
