import {first} from 'lodash-es';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {IEmailProviderContext} from '../../../../../contexts/email/types.js';
import {
  kIjxSemantic,
  kIjxUtils,
} from '../../../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../../../contexts/ijx/register.js';
import {kEmailJobType} from '../../../../../definitions/job.js';
import {
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../../../definitions/system.js';
import {kForgotPasswordEmailArtifacts} from '../../../../../emailTemplates/forgotPassword.js';
import {getNewIdForResource} from '../../../../../utils/resource.js';
import MockTestEmailProviderContext from '../../../../testHelpers/context/email/MockTestEmailProviderContext.js';
import {generateAndInsertAgentTokenListForTest} from '../../../../testHelpers/generate/agentToken.js';
import {generateAndInsertUserListForTest} from '../../../../testHelpers/generate/user.js';
import {completeTests} from '../../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../../testHelpers/utils.js';
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
    kRegisterIjxUtils.email(testEmailProvider);

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
    expect(params.source).toBe(kIjxUtils.suppliedConfig().senderEmailAddress);

    const [dbExistingForgotTokens, dbNewForgotTokens] = await Promise.all([
      kIjxSemantic.agentToken().getManyByQuery({
        forEntityId: user.resourceId,
        isDeleted: true,
        scope: kTokenAccessScope.changePassword,
      }),
      kIjxSemantic.agentToken().getManyByQuery({
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
