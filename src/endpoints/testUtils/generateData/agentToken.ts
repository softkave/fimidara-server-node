import {faker} from '@faker-js/faker';
import {IAgentToken} from '../../../definitions/agentToken';
import {AppResourceType, CURRENT_TOKEN_VERSION, IAgent} from '../../../definitions/system';
import {newWorkspaceResource} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {IBaseContext} from '../../contexts/types';

export function generateAgentTokenForTest(seed: Partial<IAgentToken> = {}) {
  const agentType = AppResourceType.AgentToken;
  const agentTokenId = getNewIdForResource(agentType);
  const createdBy: IAgent = {
    agentType,
    agentTokenId,
    agentId: agentTokenId,
  };
  const token: IAgentToken = newWorkspaceResource(
    createdBy,
    AppResourceType.AgentToken,
    getNewIdForResource(AppResourceType.Workspace),
    {
      agentType,
      name: faker.company.name(),
      description: faker.lorem.sentence(),
      version: CURRENT_TOKEN_VERSION,
      separateEntityId: null,
      ...seed,
    }
  );
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
  await ctx.semantic.agentToken.insertItem(items);
  return items;
}
