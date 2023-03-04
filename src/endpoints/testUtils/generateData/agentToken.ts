import {faker} from '@faker-js/faker';
import {IAgentToken} from '../../../definitions/agentToken';
import {AppResourceType, CURRENT_TOKEN_VERSION, IAgent} from '../../../definitions/system';
import {newResource} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {IBaseContext} from '../../contexts/types';
import {randomResourceType} from './utils';

export function generateAgentTokenForTest(seed: Partial<IAgentToken> = {}) {
  const agentType = randomResourceType([
    AppResourceType.AgentToken,
    AppResourceType.ClientAssignedToken,
  ]);
  const agentTokenId = getNewIdForResource(agentType);
  const createdBy: IAgent = {
    agentType,
    agentTokenId,
    agentId: agentTokenId,
  };
  const token: IAgentToken = newResource(createdBy, AppResourceType.AgentToken, {
    agentType,
    workspaceId: getNewIdForResource(AppResourceType.Workspace),
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    version: CURRENT_TOKEN_VERSION,
    separateEntityId: null,
    ...seed,
  });

  return token;
}

export function generateAgentTokenListForTest(count = 20, seed: Partial<IAgentToken> = {}) {
  const items: IAgentToken[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generateAgentTokenForTest(seed));
  }
  return items;
}

export async function generateAndInsertAgentTokenListForTest(
  ctx: IBaseContext,
  count = 20,
  seed: Partial<IAgentToken> = {}
) {
  const items = generateAgentTokenListForTest(count, seed);
  await ctx.semantic.agentToken.insertList(items);
  return items;
}
