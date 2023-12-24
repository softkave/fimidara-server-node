import {URL} from 'url';
import {AgentToken} from '../../../definitions/agentToken';
import {
  CURRENT_TOKEN_VERSION,
  TokenAccessScopeMap,
  kAppResourceType,
} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {newResource} from '../../../utils/resource';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {userConstants} from '../constants';

export async function withConfirmEmailAddressToken(user: User, link: string) {
  return kSemanticModels.utils().withTxn(async opts => {
    const url = new URL(link);

    if (
      !url.searchParams.has(userConstants.confirmEmailTokenQueryParam) &&
      !user.isEmailVerified
    ) {
      let token = await kSemanticModels
        .agentToken()
        .getOneAgentToken(user.resourceId, TokenAccessScopeMap.ConfirmEmailAddress, opts);

      if (!token) {
        token = newResource<AgentToken>(kAppResourceType.AgentToken, {
          scope: [TokenAccessScopeMap.ConfirmEmailAddress],
          version: CURRENT_TOKEN_VERSION,
          separateEntityId: user.resourceId,
          workspaceId: null,
          agentType: kAppResourceType.User,
          createdBy: SYSTEM_SESSION_AGENT,
          lastUpdatedBy: SYSTEM_SESSION_AGENT,
        });
        await kSemanticModels.agentToken().insertItem(token, opts);
      }

      const encodedToken = kUtilsInjectables
        .session()
        .encodeToken(token.resourceId, token.expires);
      url.searchParams.set(userConstants.confirmEmailTokenQueryParam, encodedToken);
      link = url.toString();
    }

    return link;
  });
}
