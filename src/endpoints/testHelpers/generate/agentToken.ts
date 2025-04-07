import {faker} from '@faker-js/faker';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {AgentToken} from '../../../definitions/agentToken.js';
import {
  Agent,
  kCurrentJWTTokenVersion,
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../definitions/system.js';
import {getNewIdForResource, newResource} from '../../../utils/resource.js';

export function generateAgentTokenForTest(
  seed: Partial<AgentToken> & {workspaceId: string | null} = {workspaceId: null}
) {
  const agentType = kFimidaraResourceType.AgentToken;
  const agentTokenId = getNewIdForResource(agentType);
  const createdBy: Agent = {
    agentType,
    agentTokenId,
    agentId: agentTokenId,
  };
  const token = newResource<AgentToken>(kFimidaraResourceType.AgentToken, {
    createdBy,
    entityType: agentType,
    lastUpdatedBy: createdBy,
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    version: kCurrentJWTTokenVersion,
    forEntityId: null,
    scope:
      seed.workspaceId && !seed.forEntityId ? [kTokenAccessScope.access] : [],
    ...seed,
  });
  return token;
}

export function generateAgentTokenListForTest(
  count = 20,
  seed: Partial<AgentToken> & {workspaceId: string | null} = {workspaceId: null}
) {
  const items: AgentToken[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generateAgentTokenForTest(seed));
  }
  return items;
}

export async function generateAndInsertAgentTokenListForTest(
  count = 20,
  seed: Partial<AgentToken> & {workspaceId: string | null} = {workspaceId: null}
) {
  const items = generateAgentTokenListForTest(count, seed);
  await kIjxSemantic
    .utils()
    .withTxn(async opts => kIjxSemantic.agentToken().insertItem(items, opts));
  return items;
}
