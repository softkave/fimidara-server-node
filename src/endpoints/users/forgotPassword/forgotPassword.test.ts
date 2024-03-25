import {Job, EmailJobParams, kJobType, kEmailJobType} from '../../../definitions/job';
import RequestData from '../../RequestData';
import {DataQuery} from '../../contexts/data/types';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {kRegisterUtilsInjectables} from '../../contexts/injection/register';
import MockTestEmailProviderContext from '../../testUtils/context/email/MockTestEmailProviderContext';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequest,
} from '../../testUtils/testUtils';
import forgotPassword from './forgotPassword';
import {ForgotPasswordEndpointParams} from './types';

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
    kRegisterUtilsInjectables.email(new MockTestEmailProviderContext());

    const {user} = await insertUserForTest();
    const instData = RequestData.fromExpressRequest<ForgotPasswordEndpointParams>(
      mockExpressRequest(),
      {email: user.email}
    );
    const result = await forgotPassword(instData);
    assertEndpointResultOk(result);

    await kUtilsInjectables.promises().flush();
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
    const dbJob = await kSemanticModels.job().getOneByQuery(query);
    expect(dbJob).toBeTruthy();
  });
});
