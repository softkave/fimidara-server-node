import assert from 'assert';
import {add} from 'date-fns';
import {stringify} from 'querystring';
import {AgentToken} from '../../../definitions/agentToken';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  TokenAccessScope,
} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {newResource} from '../../../utils/resource';
import {validate} from '../../../utils/validate';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {BaseContextType} from '../../contexts/types';
import {userConstants} from '../constants';
import {assertUser} from '../utils';
import sendChangePasswordEmail from './sendChangePasswordEmail';
import {ForgotPasswordEndpoint} from './types';
import {forgotPasswordJoiSchema} from './validation';

export const forgotPassword: ForgotPasswordEndpoint = async (context, instData) => {
  const data = validate(instData.data, forgotPasswordJoiSchema);
  const user = await context.semantic.user.getByEmail(data.email);
  assertUser(user);
  await INTERNAL_forgotPassword(context, user);
};

export async function INTERNAL_forgotPassword(
  context: BaseContextType,
  user: User,
  opts?: SemanticDataAccessProviderMutationRunOptions
) {
  const forgotToken = await getForgotPasswordToken(context, user, opts);
  const link = getForgotPasswordLinkFromToken(context, forgotToken);
  assert(forgotToken.expires);
  await sendChangePasswordEmail(context, user.email, {
    expiration: new Date(forgotToken.expires),
    link,
    signupLink: context.appVariables.clientSignupLink,
    loginLink: context.appVariables.clientLoginLink,
    firstName: user.firstName,
  });
}

export function getForgotPasswordExpiration() {
  return add(new Date(), {
    days: userConstants.changePasswordTokenExpDurationInDays,
  });
}

export function getForgotPasswordLinkFromToken(context: BaseContextType, forgotToken: AgentToken) {
  const encodedToken = context.session.encodeToken(
    context,
    forgotToken.resourceId,
    forgotToken.expires
  );
  const link = `${context.appVariables.changePasswordLink}?${stringify({
    [userConstants.defaultTokenQueryParam]: encodedToken,
  })}`;
  return link;
}

export async function getForgotPasswordToken(
  context: BaseContextType,
  user: User,
  opts?: SemanticDataAccessProviderMutationRunOptions
) {
  const expiration = getForgotPasswordExpiration();
  const forgotToken = newResource<AgentToken>(AppResourceType.AgentToken, {
    scope: [TokenAccessScope.ChangePassword],
    version: CURRENT_TOKEN_VERSION,
    expires: expiration.valueOf(),
    separateEntityId: user.resourceId,
    workspaceId: null,
    agentType: AppResourceType.User,
    createdBy: SYSTEM_SESSION_AGENT,
    lastUpdatedBy: SYSTEM_SESSION_AGENT,
  });

  await executeWithMutationRunOptions(
    context,
    async opts => {
      await context.semantic.agentToken.insertItem(forgotToken, opts);
    },
    opts
  );

  return forgotToken;
}

export default forgotPassword;
