import assert from 'assert';
import {URL} from 'url';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {IEmailProviderContext} from '../../../../../contexts/email/types.js';
import {
  kIjxSemantic,
  kIjxUtils,
} from '../../../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../../../contexts/ijx/register.js';
import {AgentToken} from '../../../../../definitions/agentToken.js';
import {kEmailJobType} from '../../../../../definitions/job.js';
import {
  kCurrentJWTTokenVersion,
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../../../definitions/system.js';
import {User} from '../../../../../definitions/user.js';
import {kConfirmEmailAddressEmail} from '../../../../../emailTemplates/confirmEmailAddress.js';
import {kSystemSessionAgent} from '../../../../../utils/agent.js';
import {
  getNewIdForResource,
  newResource,
} from '../../../../../utils/resource.js';
import MockTestEmailProviderContext from '../../../../testHelpers/context/email/MockTestEmailProviderContext.js';
import {generateAndInsertUserListForTest} from '../../../../testHelpers/generate/user.js';
import {completeTests} from '../../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../../testHelpers/utils.js';
import {kUserConstants} from '../../../../users/constants.js';
import {
  getLinkWithConfirmEmailToken,
  sendConfirmEmailAddressEmail,
} from '../sendConfirmEmailAddressEmail.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

async function createTestEmailVerificationToken(userId: string) {
  const token = newResource<AgentToken>(kFimidaraResourceType.AgentToken, {
    forEntityId: userId,
    scope: [kTokenAccessScope.confirmEmailAddress],
    version: kCurrentJWTTokenVersion,
    entityType: kFimidaraResourceType.User,
    workspaceId: null,
    createdBy: kSystemSessionAgent,
    lastUpdatedBy: kSystemSessionAgent,
  });
  await kIjxSemantic
    .utils()
    .withTxn(opts => kIjxSemantic.agentToken().insertItem(token, opts));
  return token;
}

function assertLinkWithToken(
  link: string,
  token?: string | null,
  /** to test that existing search params are preserved */
  originalLink?: string
) {
  const url = new URL(link);

  if (token) {
    expect(
      url.searchParams.get(kUserConstants.confirmEmailTokenQueryParam)
    ).toBe(token);
  } else {
    expect(
      url.searchParams.get(kUserConstants.confirmEmailTokenQueryParam)
    ).toBeTruthy();
  }

  if (originalLink) {
    url.searchParams.delete(kUserConstants.confirmEmailTokenQueryParam);
    expect(url.toString()).toBe(originalLink);
  }
}

describe('sendConfirmEmailAddressEmail', () => {
  test('email verification token added with other params preserved', async () => {
    const prevLink = 'http://localhost/?token=prevToken';
    const link = await getLinkWithConfirmEmailToken(
      {
        resourceId: getNewIdForResource(kFimidaraResourceType.User),
        isEmailVerified: false,
      } as User,
      prevLink
    );
    assertLinkWithToken(link, null, prevLink);
  });

  test('email verification token reused', async () => {
    const userId = getNewIdForResource(kFimidaraResourceType.User);
    const token = await createTestEmailVerificationToken(userId);
    const prevLink = 'http://localhost/?token=prevToken';
    const link = await getLinkWithConfirmEmailToken(
      {resourceId: userId, isEmailVerified: false} as User,
      prevLink
    );
    const encodedToken = await kIjxUtils
      .session()
      .encodeToken({tokenId: token.resourceId, expiresAt: token.expiresAt});
    assertLinkWithToken(link, encodedToken.jwtToken, prevLink);
  });

  test('sendEmail called', async () => {
    const [user] = await generateAndInsertUserListForTest(1, () => ({
      emailVerificationEmailSentAt: Date.now(),
    }));
    const testEmailProvider = new MockTestEmailProviderContext();
    kRegisterIjxUtils.email(testEmailProvider);

    await sendConfirmEmailAddressEmail(
      getNewIdForResource(kFimidaraResourceType.Job),
      {
        emailAddress: [user.email],
        userId: [user.resourceId],
        type: kEmailJobType.confirmEmailAddress,
      }
    );

    const call = testEmailProvider.sendEmail.mock.lastCall as Parameters<
      IEmailProviderContext['sendEmail']
    >;
    const params = call[0];
    expect(params.body.html).toBeTruthy();
    expect(params.body.text).toBeTruthy();
    expect(params.destination).toEqual([user.email]);
    expect(params.subject).toBe(kConfirmEmailAddressEmail.title);
    expect(params.source).toBe(kIjxUtils.suppliedConfig().senderEmailAddress);

    await kIjxUtils.promises().flush();
    const dbUser = await kIjxSemantic.user().getOneById(user.resourceId);
    expect(dbUser?.emailVerificationEmailSentAt).toBeGreaterThan(
      user.emailVerificationEmailSentAt || 0
    );

    const suppliedConfig = kIjxUtils.suppliedConfig();
    assert(suppliedConfig.verifyEmailLink);
    const link = await getLinkWithConfirmEmailToken(
      user,
      suppliedConfig.verifyEmailLink
    );
    expect(params.body.html.includes(link)).toBeTruthy();
    expect(params.body.text.includes(link)).toBeTruthy();
  });
});
