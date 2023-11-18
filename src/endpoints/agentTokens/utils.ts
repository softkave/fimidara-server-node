import {AgentToken, PublicAgentToken} from '../../definitions/agentToken';
import {PermissionAction} from '../../definitions/permissionItem';
import {SessionAgent} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract';
import {cast} from '../../utils/fns';
import {reuseableErrors} from '../../utils/reusableErrors';
import {checkAuthorizationWithAgent} from '../contexts/authorizationChecks/checkAuthorizaton';
import {SemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {BaseContextType} from '../contexts/types';
import {InvalidRequestError} from '../errors';
import {workspaceResourceFields} from '../utils';

const agentTokenFields = getFields<PublicAgentToken>({
  ...workspaceResourceFields,
  name: true,
  description: true,
  tokenStr: true,
  expires: true,
  // tags: assignedTagListExtractor,
});

export const agentTokenExtractor = makeExtract(agentTokenFields);
export const agentTokenListExtractor = makeListExtract(agentTokenFields);

export async function checkAgentTokenAuthorization(
  context: BaseContextType,
  agent: SessionAgent,
  token: AgentToken,
  action: PermissionAction,
  opts?: SemanticDataAccessProviderRunOptions
) {
  appAssert(token.workspaceId);
  await checkAuthorizationWithAgent({
    context,
    agent,
    opts,
    workspaceId: token.workspaceId,
    target: {action, targetId: token.resourceId},
  });
  return {token};
}

export async function checkAgentTokenAuthorization02(
  context: BaseContextType,
  agent: SessionAgent,
  workspaceId: string | undefined,
  tokenId: string | undefined | null,
  providedResourceId: string | undefined | null,
  action: PermissionAction
) {
  let token: AgentToken | null = null;

  if (tokenId) {
    token = await context.semantic.agentToken.getOneById(tokenId);
  } else if (providedResourceId) {
    appAssert(workspaceId, new InvalidRequestError('Workspace ID not provided.'));
    token = await context.semantic.agentToken.getByProvidedId(
      workspaceId,
      providedResourceId
    );
  }

  assertAgentToken(token);
  return await checkAgentTokenAuthorization(context, agent, token, action);
}

export function throwAgentTokenNotFound() {
  throw reuseableErrors.agentToken.notFound();
}

export function getPublicAgentToken(context: BaseContextType, token: AgentToken) {
  const tokenStr = context.session.encodeToken(
    context,
    token.resourceId,
    null,
    token.createdAt
  );
  cast<PublicAgentToken>(token).tokenStr = tokenStr;
  return agentTokenExtractor(token);
}

export function assertAgentToken(token?: AgentToken | null): asserts token {
  appAssert(token, reuseableErrors.agentToken.notFound());
}
