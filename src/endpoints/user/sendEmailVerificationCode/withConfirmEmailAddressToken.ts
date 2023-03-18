import {URL} from 'url';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  SYSTEM_SESSION_AGENT,
  TokenAccessScope,
} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {appAssert} from '../../../utils/assertion';
import {newResource} from '../../../utils/fns';
import {MemStore} from '../../contexts/mem/Mem';
import {IBaseContext} from '../../contexts/types';
import {userConstants} from '../constants';

export async function withConfirmEmailAddressToken(
  context: IBaseContext,
  user: IUser,
  link: string
) {
  const url = new URL(link);
  if (!url.searchParams.has(userConstants.confirmEmailTokenQueryParam) && !user.isEmailVerified) {
    let token = await context.semantic.agentToken.getOneAgentToken(
      user.resourceId,
      TokenAccessScope.ConfirmEmailAddress
    );

    if (!token) {
      token = newResource(AppResourceType.AgentToken, {
        tokenAccessScope: [TokenAccessScope.ConfirmEmailAddress],
        userId: user.resourceId,
        version: CURRENT_TOKEN_VERSION,
        separateEntityId: user.resourceId,
        workspaceId: null,
        agentType: AppResourceType.User,
        createdBy: SYSTEM_SESSION_AGENT,
        lastUpdatedBy: SYSTEM_SESSION_AGENT,
      });
      await MemStore.withTransaction(context, async txn => {
        appAssert(token);
        await context.semantic.agentToken.insertItem(token, {transaction: txn});
      });
    }

    const encodedToken = context.session.encodeToken(context, token.resourceId, token.expires);
    url.searchParams.set(userConstants.confirmEmailTokenQueryParam, encodedToken);
    link = url.toString();
  }

  return link;
}
