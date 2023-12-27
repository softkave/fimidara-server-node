import {URL} from 'url';
import {AgentToken} from '../../../definitions/agentToken';
import {
  kAppResourceType,
  kCurrentJWTTokenVersion,
  kTokenAccessScope,
} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {kSystemSessionAgent} from '../../../utils/agent';
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
        .getOneAgentToken(user.resourceId, kTokenAccessScope.ConfirmEmailAddress, opts);

      if (!token) {
        token = newResource<AgentToken>(kAppResourceType.AgentToken, {
          scope: [kTokenAccessScope.ConfirmEmailAddress],
          version: kCurrentJWTTokenVersion,
          forEntityId: user.resourceId,
          workspaceId: null,
          entityType: kAppResourceType.User,
          createdBy: kSystemSessionAgent,
          lastUpdatedBy: kSystemSessionAgent,
        });
        await kSemanticModels.agentToken().insertItem(token, opts);
      }

      const encodedToken = kUtilsInjectables
        .session()
        .encodeToken(token.resourceId, token.expiresAt);
      url.searchParams.set(userConstants.confirmEmailTokenQueryParam, encodedToken);
      link = url.toString();
    }

    return link;
  });
}
