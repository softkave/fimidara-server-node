import {URL} from 'url';
import {IAgentToken} from '../../../definitions/agentToken';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  SYSTEM_SESSION_AGENT,
  TokenAccessScope,
} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {newResource} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {IBaseContext} from '../../contexts/types';
import {completeTest} from '../../testUtils/helpers/test';
import {assertContext, initTestBaseContext} from '../../testUtils/testUtils';
import {userConstants} from '../constants';
import {withConfirmEmailAddressToken} from './withConfirmEmailAddressToken';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

async function createTestEmailVerificationToken(userId: string) {
  assertContext(context);
  const token = newResource<IAgentToken>(AppResourceType.AgentToken, {
    separateEntityId: userId,
    scope: [TokenAccessScope.ConfirmEmailAddress],
    version: CURRENT_TOKEN_VERSION,
    agentType: AppResourceType.User,
    workspaceId: null,
    createdBy: SYSTEM_SESSION_AGENT,
    lastUpdatedBy: SYSTEM_SESSION_AGENT,
  });
  await executeWithMutationRunOptions(context, opts =>
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
      } as IUser,
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
      {resourceId: userId, isEmailVerified: false} as IUser,
      prevLink
    );
    const encodedToken = context.session.encodeToken(context, token.resourceId, token.expires);
    assertLinkWithToken(link, encodedToken, prevLink);
  });

  test('email verification token not added if already exist', async () => {
    assertContext(context);
    const userId = getNewIdForResource(AppResourceType.User);
    const token = await createTestEmailVerificationToken(userId);
    const encodedToken = context.session.encodeToken(context, token.resourceId, token.expires);
    const prevLink = `http://localhost/?token=prevToken&${userConstants.confirmEmailTokenQueryParam}=${encodedToken}`;
    const link = await withConfirmEmailAddressToken(
      context,
      {
        resourceId: getNewIdForResource(AppResourceType.User),
        isEmailVerified: false,
      } as IUser,
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
      } as IUser,
      prevLink
    );
    const url = new URL(link);
    expect(url.searchParams.has(userConstants.confirmEmailTokenQueryParam)).toBeFalsy();
  });
});
