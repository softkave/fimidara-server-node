import {URL} from 'url';
import {AgentToken} from '../../../definitions/agentToken';
import {
  CURRENT_TOKEN_VERSION,
  TokenAccessScopeMap,
  kAppResourceType,
} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {getNewIdForResource, newResource} from '../../../utils/resource';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {completeTests} from '../../testUtils/helpers/test';
import {initTests} from '../../testUtils/testUtils';
import {userConstants} from '../constants';
import {withConfirmEmailAddressToken} from './withConfirmEmailAddressToken';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

async function createTestEmailVerificationToken(userId: string) {
  const token = newResource<AgentToken>(kAppResourceType.AgentToken, {
    separateEntityId: userId,
    scope: [TokenAccessScopeMap.ConfirmEmailAddress],
    version: CURRENT_TOKEN_VERSION,
    agentType: kAppResourceType.User,
    workspaceId: null,
    createdBy: SYSTEM_SESSION_AGENT,
    lastUpdatedBy: SYSTEM_SESSION_AGENT,
  });
  await kSemanticModels
    .utils()
    .withTxn(opts => context!.semantic.agentToken.insertItem(token, opts));
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
    const prevLink = 'http://localhost/?token=prevToken';
    const link = await withConfirmEmailAddressToken(
      {
        resourceId: getNewIdForResource(kAppResourceType.User),
        isEmailVerified: false,
      } as User,
      prevLink
    );
    assertLinkWithToken(link, null, prevLink);
  });

  test('email verification token reused', async () => {
    const userId = getNewIdForResource(kAppResourceType.User);
    const token = await createTestEmailVerificationToken(userId);
    const prevLink = 'http://localhost/?token=prevToken';
    const link = await withConfirmEmailAddressToken(
      {resourceId: userId, isEmailVerified: false} as User,
      prevLink
    );
    const encodedToken = kUtilsInjectables
      .session()
      .encodeToken(token.resourceId, token.expires);
    assertLinkWithToken(link, encodedToken, prevLink);
  });

  test('email verification token not added if already exist', async () => {
    const userId = getNewIdForResource(kAppResourceType.User);
    const token = await createTestEmailVerificationToken(userId);
    const encodedToken = kUtilsInjectables
      .session()
      .encodeToken(token.resourceId, token.expires);
    const prevLink = `http://localhost/?token=prevToken&${userConstants.confirmEmailTokenQueryParam}=${encodedToken}`;
    const link = await withConfirmEmailAddressToken(
      {
        resourceId: getNewIdForResource(kAppResourceType.User),
        isEmailVerified: false,
      } as User,
      prevLink
    );
    assertLinkWithToken(link, encodedToken);
    expect(link).toBe(prevLink);
  });

  test('email verification token not added if user already verified', async () => {
    const prevLink = 'http://localhost/';
    const link = await withConfirmEmailAddressToken(
      {
        resourceId: getNewIdForResource(kAppResourceType.User),
        isEmailVerified: true,
      } as User,
      prevLink
    );
    const url = new URL(link);
    expect(url.searchParams.has(userConstants.confirmEmailTokenQueryParam)).toBeFalsy();
  });
});
