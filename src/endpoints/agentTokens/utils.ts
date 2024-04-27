import {AgentToken, PublicAgentToken} from '../../definitions/agentToken';
import {FimidaraPermissionAction} from '../../definitions/permissionItem';
import {SessionAgent} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {cast} from '../../utils/fns';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {checkAuthorizationWithAgent} from '../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../contexts/injection/injectables';
import {SemanticProviderOpParams} from '../contexts/semantic/types';
import {InvalidRequestError} from '../errors';
import {workspaceResourceFields} from '../extractors';

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
