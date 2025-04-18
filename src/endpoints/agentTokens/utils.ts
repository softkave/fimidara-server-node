import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic, kIjxUtils} from '../../contexts/ijx/injectables.js';
import {SemanticProviderOpParams} from '../../contexts/semantic/types.js';
import {
  AgentToken,
  EncodedAgentToken,
  PublicAgentToken,
} from '../../definitions/agentToken.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {SessionAgent} from '../../definitions/system.js';
import {appAssert} from '../../utils/assertion.js';
import {getFields, makeExtract, makeListExtract} from '../../utils/extract.js';
import {cast} from '../../utils/fns.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {InvalidRequestError} from '../errors.js';
import {workspaceResourceFields} from '../extractors.js';
import {kAgentTokenConstants} from './constants.js';

const agentTokenFields = getFields<PublicAgentToken>({
  ...workspaceResourceFields,
  name: true,
  description: true,
  jwtToken: true,
  expiresAt: true,
  providedResourceId: true,
  refreshToken: true,
  jwtTokenExpiresAt: true,
  shouldRefresh: true,
  refreshDuration: true,
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

export async function getAgentTokenByIdOrProvidedId(
  workspaceId: string | undefined,
  tokenId: string | undefined | null,
  providedResourceId: string | undefined | null
) {
  let token: AgentToken | null = null;

  if (tokenId) {
    token = await kIjxSemantic.agentToken().getOneById(tokenId);
  } else if (providedResourceId) {
    appAssert(
      workspaceId,
      new InvalidRequestError('Workspace ID not provided')
    );
    token = await kIjxSemantic
      .agentToken()
      .getByProvidedId(workspaceId, providedResourceId);
  }

  assertAgentToken(token);
  return token;
}

export async function checkAgentTokenAuthorization02(
  agent: SessionAgent,
  workspaceId: string | undefined,
  tokenId: string | undefined | null,
  providedResourceId: string | undefined | null,
  action: FimidaraPermissionAction
) {
  const token = await getAgentTokenByIdOrProvidedId(
    workspaceId,
    tokenId,
    providedResourceId
  );

  return await checkAgentTokenAuthorization(agent, token, action);
}

export function throwAgentTokenNotFound() {
  throw kReuseableErrors.agentToken.notFound();
}

export async function encodeAgentToken(
  token: AgentToken
): Promise<EncodedAgentToken> {
  let expiresAt = token.expiresAt;

  if (token.shouldRefresh) {
    expiresAt = Math.min(
      Date.now() +
        (token.refreshDuration ?? kAgentTokenConstants.refreshDurationMs),
      token.expiresAt || Number.MAX_SAFE_INTEGER
    );
  }

  return await kIjxUtils.session().encodeToken({
    expiresAt,
    shouldRefresh: token.shouldRefresh,
    tokenId: token.resourceId,
    issuedAt: token.createdAt,
  });
}

export async function getPublicAgentToken(
  token: AgentToken,
  shouldEncode: boolean
) {
  if (shouldEncode) {
    const {jwtTokenExpiresAt, refreshToken, jwtToken} =
      await encodeAgentToken(token);

    cast<PublicAgentToken>(token).jwtToken = jwtToken;
    cast<PublicAgentToken>(token).refreshToken = refreshToken;
    cast<PublicAgentToken>(token).jwtTokenExpiresAt = jwtTokenExpiresAt;
  }

  return agentTokenExtractor(token);
}

export function assertAgentToken(token?: AgentToken | null): asserts token {
  appAssert(token, kReuseableErrors.agentToken.notFound());
}
