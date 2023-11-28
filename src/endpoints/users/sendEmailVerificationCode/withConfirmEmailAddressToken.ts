import {URL} from 'url';
import {AgentToken} from '../../../definitions/agentToken';
import {
  AppResourceTypeMap,
  CURRENT_TOKEN_VERSION,
  TokenAccessScopeMap,
} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {newResource} from '../../../utils/resource';
import {SemanticProviderMutationRunOptions} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';
import {userConstants} from '../constants';

export async function withConfirmEmailAddressToken(
  context: BaseContextType,
  user: User,
  link: string,
  opts?: SemanticProviderMutationRunOptions
) {
  return context.semantic.utils.withTxn(
    context,
    async opts => {
      const url = new URL(link);

      if (
        !url.searchParams.has(userConstants.confirmEmailTokenQueryParam) &&
        !user.isEmailVerified
      ) {
        let token = await context.semantic.agentToken.getOneAgentToken(
          user.resourceId,
          TokenAccessScopeMap.ConfirmEmailAddress,
          opts
        );

        if (!token) {
          token = newResource<AgentToken>(AppResourceTypeMap.AgentToken, {
            scope: [TokenAccessScopeMap.ConfirmEmailAddress],
            version: CURRENT_TOKEN_VERSION,
            separateEntityId: user.resourceId,
            workspaceId: null,
            agentType: AppResourceTypeMap.User,
            createdBy: SYSTEM_SESSION_AGENT,
            lastUpdatedBy: SYSTEM_SESSION_AGENT,
          });
          await context.semantic.agentToken.insertItem(token, opts);
        }

        const encodedToken = context.session.encodeToken(
          context,
          token.resourceId,
          token.expires
        );
        url.searchParams.set(userConstants.confirmEmailTokenQueryParam, encodedToken);
        link = url.toString();
      }

      return link;
    },
    opts
  );
}
