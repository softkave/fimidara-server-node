import {add} from 'date-fns';
import {stringify} from 'querystring';
import {AgentToken} from '../../../definitions/agentToken';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  TokenAccessScope,
} from '../../../definitions/system';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {newResource} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {MemStore} from '../../contexts/mem/Mem';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {BaseContext} from '../../contexts/types';
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

  await MemStore.withTransaction(context, async txn => {
    const opts: SemanticDataAccessProviderMutationRunOptions = {transaction: txn};
    await context.semantic.agentToken.insertItem(forgotToken, opts);
  });

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

export function getForgotPasswordLinkFromToken(context: BaseContext, forgotToken: AgentToken) {
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
