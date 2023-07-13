import {faker} from '@faker-js/faker';
import {AgentToken} from '../../../definitions/agentToken';
import {Agent, AppResourceType, CURRENT_TOKEN_VERSION} from '../../../definitions/system';
import {getNewIdForResource, newResource} from '../../../utils/resource';
import {BaseContextType} from '../../contexts/types';

export function generateAgentTokenForTest(
  seed: Partial<AgentToken> & {workspaceId: string | null} = {workspaceId: null}
) {
  const agentType = AppResourceType.AgentToken;
  const agentTokenId = getNewIdForResource(agentType);
  const createdBy: Agent = {
    agentType,
    agentTokenId,
    agentId: agentTokenId,
  };
  const token = newResource<AgentToken>(AppResourceType.AgentToken, {
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
  ctx: BaseContextType,
  count = 20,
  seed: Partial<AgentToken> & {workspaceId: string | null} = {workspaceId: null}
) {
  const items = generateAgentTokenListForTest(count, seed);
  await ctx.semantic.utils.withTxn(ctx, async opts =>
    ctx.semantic.agentToken.insertItem(items, opts)
  );
  return items;
}
