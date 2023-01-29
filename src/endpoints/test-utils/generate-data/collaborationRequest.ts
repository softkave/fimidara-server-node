import {faker} from '@faker-js/faker';
import {ICollaborationRequest} from '../../../definitions/collaborationRequest';
import {AppResourceType, IAgent, SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {IBaseContext} from '../../contexts/types';
import {defaultGeneratePartialTestDataFn, GeneratePartialTestDataFn, generateTestList} from './utils';

export function generateCollaborationRequestForTest(seed: Partial<ICollaborationRequest> = {}) {
  const createdAt = getDateString();
  const createdBy: IAgent = {
    agentId: getNewIdForResource(AppResourceType.User),
    agentType: SessionAgentType.User,
  };

  const item: ICollaborationRequest = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(AppResourceType.CollaborationRequest),
    workspaceName: faker.company.name(),
    workspaceId: getNewIdForResource(AppResourceType.Workspace),
    recipientEmail: faker.internet.email(),
    message: '',
    statusHistory: [],
    ...seed,
  };

  return item;
}

export function generateCollaborationRequestListForTest(
  count = 20,
  genPartial: GeneratePartialTestDataFn<ICollaborationRequest> = defaultGeneratePartialTestDataFn
) {
  return generateTestList(() => generateCollaborationRequestForTest(), count, genPartial);
}

export async function generateAndInsertCollaborationRequestListForTest(
  ctx: IBaseContext,
  count = 20,
  genPartial: GeneratePartialTestDataFn<ICollaborationRequest> = defaultGeneratePartialTestDataFn
) {
  const items = generateCollaborationRequestListForTest(count, genPartial);
  await ctx.data.collaborationRequest.insertList(items);
  return items;
}
