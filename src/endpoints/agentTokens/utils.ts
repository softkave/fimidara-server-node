import {AgentToken, PublicAgentToken} from '../../definitions/agentToken.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {SessionAgent} from '../../definitions/system.js';
import {appAssert} from '../../utils/assertion.js';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract.js';
import {cast} from '../../utils/fns.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {checkAuthorizationWithAgent} from '../contexts/authorizationChecks/checkAuthorizaton.js';
import {kSemanticModels, kUtilsInjectables} from '../contexts/injection/injectables.js';
import {SemanticProviderOpParams} from '../contexts/semantic/types.js';
import {InvalidRequestError} from '../errors.js';
import {workspaceResourceFields} from '../extractors.js';

const agentTokenFields = getFields<PublicAgentToken>({
  ...workspaceResourceFields,
  name: true,
  description: true,
  tokenStr: true,
  expiresAt: true,
  providedResourceId: true,
  // tags: assignedTagListExtractor,
});

export const agentTokenExtractor = makeExtract(agentTokenFields);
export const agentTokenListExtractor = makeListExtract(agentTokenFields);

export async function checkAgentTokenAuthorization(
  agent: SessionAgent,
  token: AgentToken,
  action: FimidaraPermissionAction,
  opts?: SemanticProviderOpParams
) {
  appAssert(token.workspaceId);
  await checkAuthorizationWithAgent({
    agent,
    opts,
    workspaceId: token.workspaceId,
    target: {action, targetId: token.resourceId},
  });
  return {token};
}

export async function checkAgentTokenAuthorization02(
  agent: SessionAgent,
  workspaceId: string | undefined,
  tokenId: string | undefined | null,
  providedResourceId: string | undefined | null,
  action: FimidaraPermissionAction
) {
  let token: AgentToken | null = null;

  if (tokenId) {
    token = await kSemanticModels.agentToken().getOneById(tokenId);
  } else if (providedResourceId) {
    appAssert(workspaceId, new InvalidRequestError('Workspace ID not provided'));
    token = await kSemanticModels
      .agentToken()
      .getByProvidedId(workspaceId, providedResourceId);
  }

  assertAgentToken(token);
  return await checkAgentTokenAuthorization(agent, token, action);
}

export function throwAgentTokenNotFound() {
  throw kReuseableErrors.agentToken.notFound();
}

export function getPublicAgentToken(token: AgentToken) {
  const tokenStr = kUtilsInjectables
    .session()
    .encodeToken(token.resourceId, null, token.createdAt);
  cast<PublicAgentToken>(token).tokenStr = tokenStr;
  return agentTokenExtractor(token);
}

export function assertAgentToken(token?: AgentToken | null): asserts token {
  appAssert(token, kReuseableErrors.agentToken.notFound());
}
