import assert from 'assert';
import {URL} from 'url';
import {AgentToken} from '../../../../../definitions/agentToken';
import {kEmailJobType} from '../../../../../definitions/job';
import {
  kCurrentJWTTokenVersion,
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../../../definitions/system';
import {User} from '../../../../../definitions/user';
import {kConfirmEmailAddressEmail} from '../../../../../emailTemplates/confirmEmailAddress';
import {kSystemSessionAgent} from '../../../../../utils/agent';
import {getNewIdForResource, newResource} from '../../../../../utils/resource';
import {IEmailProviderContext} from '../../../../contexts/email/types';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../../contexts/injection/injectables';
import {kRegisterUtilsInjectables} from '../../../../contexts/injection/register';
import MockTestEmailProviderContext from '../../../../testUtils/context/email/MockTestEmailProviderContext';
import {generateAndInsertUserListForTest} from '../../../../testUtils/generate/user';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {initTests} from '../../../../testUtils/testUtils';
import {kUserConstants} from '../../../../users/constants';
import {
  getLinkWithConfirmEmailToken,
  sendConfirmEmailAddressEmail,
} from '../sendConfirmEmailAddressEmail';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

async function createTestEmailVerificationToken(userId: string) {
  const token = newResource<AgentToken>(kFimidaraResourceType.AgentToken, {
    forEntityId: userId,
    scope: [kTokenAccessScope.ConfirmEmailAddress],
    version: kCurrentJWTTokenVersion,
    entityType: kFimidaraResourceType.User,
    workspaceId: null,
    createdBy: kSystemSessionAgent,
    lastUpdatedBy: kSystemSessionAgent,
  });
  await kSemanticModels
    .utils()
    .withTxn(
      opts => kSemanticModels.agentToken().insertItem(token, opts),
      /** reuseTxn */ true
    );
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
    expect(url.searchParams.get(kUserConstants.confirmEmailTokenQueryParam)).toBe(token);
  } else {
    expect(url.searchParams.get(kUserConstants.confirmEmailTokenQueryParam)).toBeTruthy();
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
    const encodedToken = kUtilsInjectables
      .session()
      .encodeToken(token.resourceId, token.expiresAt);
    assertLinkWithToken(link, encodedToken, prevLink);
  });

  test('sendEmail called', async () => {
    const [user] = await generateAndInsertUserListForTest(1, () => ({
      emailVerificationEmailSentAt: Date.now(),
    }));
    const testEmailProvider = new MockTestEmailProviderContext();
    kRegisterUtilsInjectables.email(testEmailProvider);

    await sendConfirmEmailAddressEmail({
      emailAddress: [user.email],
      userId: [user.resourceId],
      type: kEmailJobType.confirmEmailAddress,
    });

    const call = testEmailProvider.sendEmail.mock.lastCall as Parameters<
      IEmailProviderContext['sendEmail']
    >;
    const params = call[0];
    expect(params.body.html).toBeTruthy();
    expect(params.body.text).toBeTruthy();
    expect(params.destination).toEqual([user.email]);
    expect(params.subject).toBe(kConfirmEmailAddressEmail.title);
    expect(params.source).toBe(
      kUtilsInjectables.suppliedConfig().appDefaultEmailAddressFrom
    );

    const dbUser = await kSemanticModels.user().getOneById(user.resourceId);
    expect(dbUser?.emailVerificationEmailSentAt).toBeGreaterThan(
      user.emailVerificationEmailSentAt || 0
    );

    const suppliedConfig = kUtilsInjectables.suppliedConfig();
    assert(suppliedConfig.verifyEmailLink);
    const link = await getLinkWithConfirmEmailToken(user, suppliedConfig.verifyEmailLink);
    expect(params.body.html.includes(link)).toBeTruthy();
    expect(params.body.text.includes(link)).toBeTruthy();
  });
});
