import assert from 'assert';
import {add} from 'date-fns';
import {stringify} from 'querystring';
import {AgentToken} from '../../../definitions/agentToken';
import {
  AppResourceTypeMap,
  CURRENT_TOKEN_VERSION,
  TokenAccessScopeMap,
} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {newResource} from '../../../utils/resource';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {userConstants} from '../constants';
import {assertUser} from '../utils';
import sendChangePasswordEmail from './sendChangePasswordEmail';
import {ForgotPasswordEndpoint} from './types';
import {forgotPasswordJoiSchema} from './validation';

export const forgotPassword: ForgotPasswordEndpoint = async instData => {
  const data = validate(instData.data, forgotPasswordJoiSchema);
  const user = await kSemanticModels.user().getByEmail(data.email);
  assertUser(user);
  await INTERNAL_forgotPassword(user);
};

export async function INTERNAL_forgotPassword(user: User) {
  const forgotToken = await getForgotPasswordToken(user);
  const link = getForgotPasswordLinkFromToken(forgotToken);
  assert(forgotToken.expires);
  await sendChangePasswordEmail(user.email, {
    expiration: new Date(forgotToken.expires),
    link,
    signupLink: kUtilsInjectables.config().clientSignupLink,
    loginLink: kUtilsInjectables.config().clientLoginLink,
    firstName: user.firstName,
  });
}

export function getForgotPasswordExpiration() {
  return add(new Date(), {
    days: userConstants.changePasswordTokenExpDurationInDays,
  });
}

export function getForgotPasswordLinkFromToken(forgotToken: AgentToken) {
  const encodedToken = kUtilsInjectables
    .session()
    .encodeToken(forgotToken.resourceId, forgotToken.expires);
  const link = `${kUtilsInjectables.config().changePasswordLink}?${stringify({
    [userConstants.defaultTokenQueryParam]: encodedToken,
  })}`;
  return link;
}

export async function getForgotPasswordToken(user: User) {
  const expiration = getForgotPasswordExpiration();
  const forgotToken = newResource<AgentToken>(AppResourceTypeMap.AgentToken, {
    scope: [TokenAccessScopeMap.ChangePassword],
    version: CURRENT_TOKEN_VERSION,
    expires: expiration.valueOf(),
    separateEntityId: user.resourceId,
    workspaceId: null,
    agentType: AppResourceTypeMap.User,
    createdBy: SYSTEM_SESSION_AGENT,
    lastUpdatedBy: SYSTEM_SESSION_AGENT,
  });

  await kSemanticModels.utils().withTxn(async opts => {
    await kSemanticModels.agentToken().insertItem(forgotToken, opts);
  });

  return forgotToken;
}

export default forgotPassword;
