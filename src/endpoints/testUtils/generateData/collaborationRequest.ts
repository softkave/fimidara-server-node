import {faker} from '@faker-js/faker';
import {
  CollaborationRequest,
  CollaborationRequestStatusTypeMap,
} from '../../../definitions/collaborationRequest';
import {Agent, AppResourceTypeMap} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injectables';
import {
  GeneratePartialTestDataFn,
  defaultGeneratePartialTestDataFn,
  generateTestList,
} from './utils';

export function generateCollaborationRequestForTest(
  seed: Partial<CollaborationRequest> = {}
) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(AppResourceTypeMap.User),
    agentType: AppResourceTypeMap.User,
    agentTokenId: getNewIdForResource(AppResourceTypeMap.AgentToken),
  };
  const item: CollaborationRequest = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(AppResourceTypeMap.CollaborationRequest),
    workspaceName: faker.company.name(),
    workspaceId: getNewIdForResource(AppResourceTypeMap.Workspace),
    recipientEmail: faker.internet.email(),
    message: '',
    status: CollaborationRequestStatusTypeMap.Pending,
    statusDate: getTimestamp(),
    ...seed,
  };
  return item;
}

export function generateCollaborationRequestListForTest(
  count = 20,
  genPartial: GeneratePartialTestDataFn<CollaborationRequest> = defaultGeneratePartialTestDataFn
) {
  return generateTestList(() => generateCollaborationRequestForTest(), count, genPartial);
}

export async function generateAndInsertCollaborationRequestListForTest(
  count = 20,
  genPartial: GeneratePartialTestDataFn<CollaborationRequest> = defaultGeneratePartialTestDataFn
) {
  const items = generateCollaborationRequestListForTest(count, genPartial);
  await kSemanticModels
    .utils()
    .withTxn(async opts =>
      kSemanticModels.collaborationRequest().insertItem(items, opts)
    );
  return items;
}
