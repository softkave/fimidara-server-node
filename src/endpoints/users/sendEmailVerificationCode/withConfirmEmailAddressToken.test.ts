import {URL} from 'url';
import {AgentToken} from '../../../definitions/agentToken';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  TokenAccessScope,
} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {getNewIdForResource, newResource} from '../../../utils/resource';
import {BaseContextType} from '../../contexts/types';
import {completeTest} from '../../testUtils/helpers/test';
import {assertContext, initTestBaseContext} from '../../testUtils/testUtils';
import {userConstants} from '../constants';
import {withConfirmEmailAddressToken} from './withConfirmEmailAddressToken';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

async function createTestEmailVerificationToken(userId: string) {
  assertContext(context);
  const token = newResource<AgentToken>(AppResourceType.AgentToken, {
    separateEntityId: userId,
    scope: [TokenAccessScope.ConfirmEmailAddress],
    version: CURRENT_TOKEN_VERSION,
    agentType: AppResourceType.User,
    workspaceId: null,
    createdBy: SYSTEM_SESSION_AGENT,
    lastUpdatedBy: SYSTEM_SESSION_AGENT,
  });
  await context.semantic.utils.withTxn(context, opts =>
    context!.semantic.agentToken.insertItem(token, opts)
  );
  return token;
}

function assertLinkWithToken(link: string, token?: string | null, prevLink?: string) {
  const url = new URL(link);

  if (token) {
    expect(url.searchParams.get(userConstants.confirmEmailTokenQueryParam)).toBe(token);
  } else {
    expect(url.searchParams.get(userConstants.confirmEmailTokenQueryParam)).toBeTruthy();
  }

  if (prevLink) {
    url.searchParams.delete(userConstants.confirmEmailTokenQueryParam);
    expect(url.toString()).toBe(prevLink);
  }
}

describe('withConfirmEmailAddress', () => {
  test('email verification token added with other params preserved', async () => {
    assertContext(context);
    const prevLink = 'http://localhost/?token=prevToken';
    const link = await withConfirmEmailAddressToken(
      context,
      {
        resourceId: getNewIdForResource(AppResourceType.User),
        isEmailVerified: false,
      } as User,
      prevLink
    );
    assertLinkWithToken(link, null, prevLink);
  });

  test('email verification token reused', async () => {
    assertContext(context);
    const userId = getNewIdForResource(AppResourceType.User);
    const token = await createTestEmailVerificationToken(userId);
    const prevLink = 'http://localhost/?token=prevToken';
    const link = await withConfirmEmailAddressToken(
      context,
      {resourceId: userId, isEmailVerified: false} as User,
      prevLink
    );
    const encodedToken = context.session.encodeToken(
      context,
      token.resourceId,
      token.expires
    );
    assertLinkWithToken(link, encodedToken, prevLink);
  });

  test('email verification token not added if already exist', async () => {
    assertContext(context);
    const userId = getNewIdForResource(AppResourceType.User);
    const token = await createTestEmailVerificationToken(userId);
    const encodedToken = context.session.encodeToken(
      context,
      token.resourceId,
      token.expires
    );
    const prevLink = `http://localhost/?token=prevToken&${userConstants.confirmEmailTokenQueryParam}=${encodedToken}`;
    const link = await withConfirmEmailAddressToken(
      context,
      {
        resourceId: getNewIdForResource(AppResourceType.User),
        isEmailVerified: false,
      } as User,
      prevLink
    );
    assertLinkWithToken(link, encodedToken);
    expect(link).toBe(prevLink);
  });

  test('email verification token not added if user already verified', async () => {
    assertContext(context);
    const prevLink = 'http://localhost/';
    const link = await withConfirmEmailAddressToken(
      context,
      {
        resourceId: getNewIdForResource(AppResourceType.User),
        isEmailVerified: true,
      } as User,
      prevLink
    );
    const url = new URL(link);
    expect(url.searchParams.has(userConstants.confirmEmailTokenQueryParam)).toBeFalsy();
  });
});
