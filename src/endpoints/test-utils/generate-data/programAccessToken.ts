import {faker} from '@faker-js/faker';
import {IProgramAccessToken} from '../../../definitions/programAccessToken';
import {AppResourceType, IAgent, SessionAgentType} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {IBaseContext} from '../../contexts/types';

export function generateProgramAccessTokenForTest(seed: Partial<IProgramAccessToken> = {}) {
  const createdAt = getTimestamp();
  const createdBy: IAgent = {
    agentId: getNewIdForResource(AppResourceType.User),
    agentType: SessionAgentType.User,
  };

  const token: IProgramAccessToken = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(AppResourceType.ProgramAccessToken),
    workspaceId: getNewIdForResource(AppResourceType.Workspace),
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    hash: '',
    ...seed,
  };

  return token;
}

export function generateProgramAccessTokenListForTest(
  count = 20,
  seed: Partial<IProgramAccessToken> = {}
) {
  const items: IProgramAccessToken[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generateProgramAccessTokenForTest(seed));
  }
  return items;
}

export async function generateAndInsertProgramAccessTokenListForTest(
  ctx: IBaseContext,
  count = 20,
  seed: Partial<IProgramAccessToken> = {}
) {
  const items = generateProgramAccessTokenListForTest(count, seed);
  await ctx.semantic.programAccessToken.insertList(items);
  return items;
}
