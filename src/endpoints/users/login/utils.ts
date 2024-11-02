import assert from 'assert';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {AgentToken} from '../../../definitions/agentToken.js';
import {
  kCurrentJWTTokenVersion,
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../definitions/system.js';
import {User} from '../../../definitions/user.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {appAssert} from '../../../utils/assertion.js';
import {ServerError} from '../../../utils/errors.js';
import {newResource} from '../../../utils/resource.js';
import {kAgentTokenConstants} from '../../agentTokens/constants.js';
import {encodeAgentToken} from '../../agentTokens/utils.js';
import {userExtractor} from '../utils.js';
import {LoginResult} from './types.js';

export async function toLoginResult(
  user: User,
  token: AgentToken
): Promise<LoginResult> {
  const stringToken = await encodeAgentToken(token);

  appAssert(
    stringToken.jwtTokenExpiresAt,
    new ServerError(),
    'Token expiresAt not set'
  );
  appAssert(
    stringToken.refreshToken,
    new ServerError(),
    'Token refreshToken not set'
  );

  return {
    user: userExtractor(user),
    jwtToken: stringToken.jwtToken,
    refreshToken: stringToken.refreshToken,
    jwtTokenExpiresAt: stringToken.jwtTokenExpiresAt,
  };
}

export async function getUserToken(
  workspaceId: string,
  userId: string,
  opts: SemanticProviderMutationParams
) {
  let userToken = await kSemanticModels
    .agentToken()
    .getUserAgentToken(userId, kTokenAccessScope.login, opts);

  if (!userToken?.shouldRefresh) {
    userToken = newResource<AgentToken>(kFimidaraResourceType.AgentToken, {
      workspaceId,
      scope: [kTokenAccessScope.login],
      version: kCurrentJWTTokenVersion,
      forEntityId: userId,
      entityType: kFimidaraResourceType.User,
      createdBy: kSystemSessionAgent,
      lastUpdatedBy: kSystemSessionAgent,
      shouldRefresh: true,
      refreshDuration: kAgentTokenConstants.refreshDurationMs,
    });

    await kSemanticModels.agentToken().insertItem(userToken, opts);
  }

  return userToken;
}

export async function getLoginResult(user: User) {
  const userToken = await kSemanticModels.utils().withTxn(opts => {
    assert.ok(user.workspaceId);
    return getUserToken(user.workspaceId, user.resourceId, opts);
  });

  return await toLoginResult(user, userToken);
}
