import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  IAgent,
  SessionAgentType,
} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {IBaseContext} from '../../contexts/types';

export function generateClientAssignedTokenForTest(seed: Partial<IClientAssignedToken> = {}) {
  const createdAt = getTimestamp();
  const createdBy: IAgent = {
    agentId: getNewIdForResource(AppResourceType.User),
    agentType: SessionAgentType.User,
  };

  const token: IClientAssignedToken = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(AppResourceType.ClientAssignedToken),
    workspaceId: getNewIdForResource(AppResourceType.Workspace),
    version: CURRENT_TOKEN_VERSION,
    ...seed,
  };

  return token;
}

export function generateClientAssignedTokenListForTest(
  count = 20,
  seed: Partial<IClientAssignedToken> = {}
) {
  const items: IClientAssignedToken[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generateClientAssignedTokenForTest(seed));
  }
  return items;
}

export async function generateAndInsertClientAssignedTokenListForTest(
  ctx: IBaseContext,
  count = 20,
  seed: Partial<IClientAssignedToken> = {}
) {
  const items = generateClientAssignedTokenListForTest(count, seed);
  await ctx.semantic.clientAssignedToken.insertList(items);
  return items;
}
