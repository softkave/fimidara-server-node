import {faker} from '@faker-js/faker';
import {IAgentToken} from '../../../definitions/agentToken';
import {AppResourceType, CURRENT_TOKEN_VERSION, IAgent} from '../../../definitions/system';
import {newResource} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {IBaseContext} from '../../contexts/types';

export function generateAgentTokenForTest(
  seed: Partial<IAgentToken> & {workspaceId: string | null} = {workspaceId: null}
) {
  const agentType = AppResourceType.AgentToken;
  const agentTokenId = getNewIdForResource(agentType);
  const createdBy: IAgent = {
    agentType,
    agentTokenId,
    agentId: agentTokenId,
  };
  const token = newResource<IAgentToken>(AppResourceType.AgentToken, {
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
  seed: Partial<IAgentToken> & {workspaceId: string | null} = {workspaceId: null}
) {
  const items: IAgentToken[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generateAgentTokenForTest(seed));
  }
  return items;
}

export async function generateAndInsertAgentTokenListForTest(
  ctx: IBaseContext,
  count = 20,
  seed: Partial<IAgentToken> & {workspaceId: string | null} = {workspaceId: null}
) {
  const items = generateAgentTokenListForTest(count, seed);
  await executeWithMutationRunOptions(ctx, async opts =>
    ctx.semantic.agentToken.insertItem(items, opts)
  );
  return items;
}
