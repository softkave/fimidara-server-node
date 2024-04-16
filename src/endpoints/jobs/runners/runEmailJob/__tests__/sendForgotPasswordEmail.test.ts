import {first} from 'lodash';
import {kEmailJobType} from '../../../../../definitions/job';
import {
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../../../definitions/system';
import {kForgotPasswordEmailArtifacts} from '../../../../../emailTemplates/forgotPassword';
import {IEmailProviderContext} from '../../../../contexts/email/types';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../../contexts/injection/injectables';
import {kRegisterUtilsInjectables} from '../../../../contexts/injection/register';
import MockTestEmailProviderContext from '../../../../testUtils/context/email/MockTestEmailProviderContext';
import {generateAndInsertAgentTokenListForTest} from '../../../../testUtils/generate/agentToken';
import {generateAndInsertUserListForTest} from '../../../../testUtils/generate/user';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {initTests} from '../../../../testUtils/testUtils';
import {
  getForgotPasswordLinkFromToken,
  sendForgotPasswordEmail,
} from '../sendForgotPasswordEmail';
import {getNewIdForResource} from '../../../../../utils/resource';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('sendForgotPasswordEmail', () => {
  test('sendEmail called', async () => {
    const [user] = await generateAndInsertUserListForTest(1);
    const [existingForgotToken] = await generateAndInsertAgentTokenListForTest(1, {
      forEntityId: user.resourceId,
      scope: [kTokenAccessScope.ChangePassword],
      isDeleted: false,
      workspaceId: null,
    });

    const testEmailProvider = new MockTestEmailProviderContext();
    kRegisterUtilsInjectables.email(testEmailProvider);

    await sendForgotPasswordEmail(getNewIdForResource(kFimidaraResourceType.Job), {
      emailAddress: [user.email],
      userId: [user.resourceId],
      type: kEmailJobType.forgotPassword,
    });

    const call = testEmailProvider.sendEmail.mock.lastCall as Parameters<
      IEmailProviderContext['sendEmail']
    >;
    const params = call[0];
    expect(params.body.html).toBeTruthy();
    expect(params.body.text).toBeTruthy();
    expect(params.destination).toEqual([user.email]);
    expect(params.subject).toBe(kForgotPasswordEmailArtifacts.title);
    expect(params.source).toBe(
      kUtilsInjectables.suppliedConfig().appDefaultEmailAddressFrom
    );

    const [dbExistingForgotTokens, dbNewForgotTokens] = await Promise.all([
      kSemanticModels.agentToken().getManyByQuery({
        forEntityId: user.resourceId,
        isDeleted: true,
        scope: kTokenAccessScope.ChangePassword,
      }),
      kSemanticModels.agentToken().getManyByQuery({
        forEntityId: user.resourceId,
        isDeleted: false,
        scope: kTokenAccessScope.ChangePassword,
      }),
    ]);

    expect(dbExistingForgotTokens).toHaveLength(1);
    expect(first(dbExistingForgotTokens)?.resourceId).toBe(
      existingForgotToken.resourceId
    );
    expect(dbNewForgotTokens).toHaveLength(1);

    const link = await getForgotPasswordLinkFromToken(dbNewForgotTokens[0]);
    expect(params.body.html.includes(link)).toBeTruthy();
    expect(params.body.text.includes(link)).toBeTruthy();
  });
});
