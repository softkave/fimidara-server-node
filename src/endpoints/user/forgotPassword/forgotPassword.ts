import {add} from 'date-fns';
import {stringify} from 'querystring';
import {IAgentToken} from '../../../definitions/agentToken';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  SYSTEM_SESSION_AGENT,
  TokenAccessScope,
} from '../../../definitions/system';
import {newResource} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {IBaseContext} from '../../contexts/types';
import {userConstants} from '../constants';
import {assertUser} from '../utils';
import sendChangePasswordEmail from './sendChangePasswordEmail';
import {ForgotPasswordEndpoint} from './types';
import {forgotPasswordJoiSchema} from './validation';

export const forgotPassword: ForgotPasswordEndpoint = async (context, instData) => {
  const data = validate(instData.data, forgotPasswordJoiSchema);
  const user = await context.semantic.user.getByEmail(data.email);
  assertUser(user);
  const expiration = getForgotPasswordExpiration();
  const forgotToken: IAgentToken = newResource(AppResourceType.AgentToken, {
    tokenAccessScope: [TokenAccessScope.ChangePassword],
    userId: user.resourceId,
    version: CURRENT_TOKEN_VERSION,
    expires: expiration.valueOf(),
    separateEntityId: user.resourceId,
    workspaceId: null,
    agentType: AppResourceType.User,
    createdBy: SYSTEM_SESSION_AGENT,
    lastUpdatedBy: SYSTEM_SESSION_AGENT,
  });
  await context.semantic.agentToken.insertItem(forgotToken);
  const link = getForgotPasswordLinkFromToken(context, forgotToken);
  await sendChangePasswordEmail(context, {
    expiration,
    link,
    emailAddress: user.email,
  });
};

export function getForgotPasswordExpiration() {
  return add(new Date(), {
    days: userConstants.changePasswordTokenExpDurationInDays,
  });
}

export function getForgotPasswordLinkFromToken(context: IBaseContext, forgotToken: IAgentToken) {
  const encodedToken = context.session.encodeToken(
    context,
    forgotToken.resourceId,
    forgotToken.expires
  );
  const link = `${context.appVariables.clientDomain}${
    context.appVariables.changePasswordPath
  }?${stringify({
    [userConstants.defaultTokenQueryParam]: encodedToken,
  })}`;
  return link;
}

export default forgotPassword;
