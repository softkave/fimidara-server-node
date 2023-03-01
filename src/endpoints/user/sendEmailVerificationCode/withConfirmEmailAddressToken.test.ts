import {URL} from 'url';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  SYSTEM_SESSION_AGENT,
  TokenFor,
} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {newResource} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {IBaseContext} from '../../contexts/types';
import {assertContext, initTestBaseContext} from '../../test-utils/test-utils';
import {userConstants} from '../constants';
import {withConfirmEmailAddressToken} from './withConfirmEmailAddressToken';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

async function createTestEmailVerificationToken(userId: string) {
  assertContext(context);
  return await context.semantic.userToken.insertItem(
    newResource(SYSTEM_SESSION_AGENT, AppResourceType.UserToken, {
      userId,
      audience: [TokenFor.ConfirmEmailAddress],
      resourceId: getNewIdForResource(AppResourceType.UserToken),
      version: CURRENT_TOKEN_VERSION,
    })
  );
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

    const encodedToken = context.session.encodeToken(
      context,
      token.resourceId,
      AppResourceType.UserToken,
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
      AppResourceType.UserToken,
      token.expires
    );

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
