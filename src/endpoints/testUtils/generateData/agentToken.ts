import {faker} from '@faker-js/faker';
import {AgentToken} from '../../../definitions/agentToken';
import {
  Agent,
  AppResourceTypeMap,
  CURRENT_TOKEN_VERSION,
} from '../../../definitions/system';
import {getNewIdForResource, newResource} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injectables';

export function generateAgentTokenForTest(
  seed: Partial<AgentToken> & {workspaceId: string | null} = {workspaceId: null}
) {
  const agentType = AppResourceTypeMap.AgentToken;
  const agentTokenId = getNewIdForResource(agentType);
  const createdBy: Agent = {
    agentType,
    agentTokenId,
    agentId: agentTokenId,
  };
  const token = newResource<AgentToken>(AppResourceTypeMap.AgentToken, {
    createdBy,
    agentType,
    lastUpdatedBy: createdBy,
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    version: CURRENT_TOKEN_VERSION,
    separateEntityId: null,
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
  await kSemanticModels
    .utils()
    .withTxn(async opts => kSemanticModels.agentToken().insertItem(items, opts));
  return items;
}
