import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {AgentToken} from '../../../definitions/agentToken.js';
import {
  kCurrentJWTTokenVersion,
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../definitions/system.js';
import {User, UserWithWorkspace} from '../../../definitions/user.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {appAssert} from '../../../utils/assertion.js';
import {ServerError} from '../../../utils/errors.js';
import {newResource} from '../../../utils/resource.js';
import {kAgentTokenConstants} from '../../agentTokens/constants.js';
import {encodeAgentToken} from '../../agentTokens/utils.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {userExtractor} from '../utils.js';
import {LoginResult} from './types.js';

export async function toLoginResult(
  user: UserWithWorkspace,
  token: AgentToken,
  clientAssignedToken: AgentToken
): Promise<LoginResult> {
  const [stringToken, stringClientAssignedToken] = await Promise.all([
    encodeAgentToken(token),
    encodeAgentToken(clientAssignedToken),
  ]);

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
    clientJwtToken: stringClientAssignedToken.jwtToken,
    refreshToken: stringToken.refreshToken,
    jwtTokenExpiresAt: stringToken.jwtTokenExpiresAt,
  };
}

export async function getExistingUserClientAssignedToken(
  userId: string,
  opts: SemanticProviderMutationParams
) {
  appAssert(
    kIjxUtils.runtimeConfig().appWorkspaceId,
    new ServerError(),
    'App workspace ID not set'
  );

  const token = await kIjxSemantic
    .agentToken()
    .getByProvidedId(kIjxUtils.runtimeConfig().appWorkspaceId, userId, opts);

  return token;
}

export async function getUserClientAssignedToken(
  userId: string,
  opts: SemanticProviderMutationParams
) {
  let token = await getExistingUserClientAssignedToken(userId, opts);

  if (!token?.shouldRefresh) {
    token = newResource<AgentToken>(kFimidaraResourceType.AgentToken, {
      providedResourceId: userId,
      workspaceId: kIjxUtils.runtimeConfig().appWorkspaceId,
      version: kCurrentJWTTokenVersion,
      forEntityId: userId,
      entityType: kFimidaraResourceType.User,
      createdBy: kSystemSessionAgent,
      lastUpdatedBy: kSystemSessionAgent,
      scope: [kTokenAccessScope.access],
      shouldRefresh: true,
      refreshDuration: kAgentTokenConstants.refreshDurationMs,
    });

    await kIjxSemantic.agentToken().insertItem(token, opts);
  }

  return token;
}

export async function getExistingUserToken(
  userId: string,
  opts: SemanticProviderMutationParams
) {
  const userToken = await kIjxSemantic
    .agentToken()
    .getUserAgentToken(userId, kTokenAccessScope.login, opts);

  return userToken;
}

export async function getUserToken(
  userId: string,
  opts: SemanticProviderMutationParams
) {
  let userToken = await getExistingUserToken(userId, opts);

  if (!userToken?.shouldRefresh) {
    userToken = newResource<AgentToken>(kFimidaraResourceType.AgentToken, {
      scope: [kTokenAccessScope.login],
      version: kCurrentJWTTokenVersion,
      forEntityId: userId,
      workspaceId: null,
      entityType: kFimidaraResourceType.User,
      createdBy: kSystemSessionAgent,
      lastUpdatedBy: kSystemSessionAgent,
      shouldRefresh: true,
      refreshDuration: kAgentTokenConstants.refreshDurationMs,
    });

    await kIjxSemantic.agentToken().insertItem(userToken, opts);
  }

  return userToken;
}

export async function getLoginResult(user: User) {
  const [userToken, clientAssignedToken] = await kIjxSemantic
    .utils()
    .withTxn(opts =>
      Promise.all([
        getUserToken(user.resourceId, opts),
        getUserClientAssignedToken(user.resourceId, opts),
      ])
    );

  const userWithWorkspaces = await populateUserWorkspaces(user);
  return await toLoginResult(
    userWithWorkspaces,
    userToken,
    clientAssignedToken
  );
}
