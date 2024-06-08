import {first} from 'lodash-es';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kEmailJobType} from '../../../../../definitions/job.js';
import {
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../../../definitions/system.js';
import {kForgotPasswordEmailArtifacts} from '../../../../../emailTemplates/forgotPassword.js';
import {getNewIdForResource} from '../../../../../utils/resource.js';
import {IEmailProviderContext} from '../../../../contexts/email/types.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../../contexts/injection/injectables.js';
import {kRegisterUtilsInjectables} from '../../../../contexts/injection/register.js';
import MockTestEmailProviderContext from '../../../../testUtils/context/email/MockTestEmailProviderContext.js';
import {generateAndInsertAgentTokenListForTest} from '../../../../testUtils/generate/agentToken.js';
import {generateAndInsertUserListForTest} from '../../../../testUtils/generate/user.js';
import {completeTests} from '../../../../testUtils/helpers/testFns.js';
import {initTests} from '../../../../testUtils/testUtils.js';
import {
  getForgotPasswordLinkFromToken,
  sendForgotPasswordEmail,
} from '../sendForgotPasswordEmail.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('sendForgotPasswordEmail', () => {
  test('sendEmail called', async () => {
    const [user] = await generateAndInsertUserListForTest(1);
    const [existingForgotToken] = await generateAndInsertAgentTokenListForTest(
      1,
      {
        forEntityId: user.resourceId,
        scope: [kTokenAccessScope.changePassword],
        isDeleted: false,
        workspaceId: null,
      }
    );

    const testEmailProvider = new MockTestEmailProviderContext();
    kRegisterUtilsInjectables.email(testEmailProvider);

    await sendForgotPasswordEmail(
      getNewIdForResource(kFimidaraResourceType.Job),
      {
        emailAddress: [user.email],
        userId: [user.resourceId],
        type: kEmailJobType.forgotPassword,
      }
    );

    const call = testEmailProvider.sendEmail.mock.lastCall as Parameters<
      IEmailProviderContext['sendEmail']
    >;
    const params = call[0];
    expect(params.body.html).toBeTruthy();
    expect(params.body.text).toBeTruthy();
    expect(params.destination).toEqual([user.email]);
    expect(params.subject).toBe(kForgotPasswordEmailArtifacts.title);
    expect(params.source).toBe(
      kUtilsInjectables.suppliedConfig().senderEmailAddress
    );

    const [dbExistingForgotTokens, dbNewForgotTokens] = await Promise.all([
      kSemanticModels.agentToken().getManyByQuery({
        forEntityId: user.resourceId,
        isDeleted: true,
        scope: kTokenAccessScope.changePassword,
      }),
      kSemanticModels.agentToken().getManyByQuery({
        forEntityId: user.resourceId,
        isDeleted: false,
        scope: kTokenAccessScope.changePassword,
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
