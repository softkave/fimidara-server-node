import {faker} from '@faker-js/faker';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {
  CollaborationRequest,
  kCollaborationRequestStatusTypeMap,
} from '../../../definitions/collaborationRequest.js';
import {Agent, kFimidaraResourceType} from '../../../definitions/system.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {
  GeneratePartialTestDataFn,
  defaultGeneratePartialTestDataFn,
  generateTestList,
} from './utils.js';

export function generateCollaborationRequestForTest(
  seed: Partial<CollaborationRequest> = {}
) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(kFimidaraResourceType.User),
    agentType: kFimidaraResourceType.User,
    agentTokenId: getNewIdForResource(kFimidaraResourceType.AgentToken),
  };
  const item: CollaborationRequest = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(kFimidaraResourceType.CollaborationRequest),
    workspaceName: faker.company.name(),
    workspaceId: getNewIdForResource(kFimidaraResourceType.Workspace),
    recipientEmail: faker.internet.email(),
    message: '',
    status: kCollaborationRequestStatusTypeMap.Pending,
    statusDate: getTimestamp(),
    isDeleted: false,
    ...seed,
  };
  return item;
}

export function generateCollaborationRequestListForTest(
  count = 20,
  genPartial: GeneratePartialTestDataFn<CollaborationRequest> = defaultGeneratePartialTestDataFn
) {
  return generateTestList(
    () => generateCollaborationRequestForTest(),
    count,
    genPartial
  );
}

export async function generateAndInsertCollaborationRequestListForTest(
  count = 20,
  genPartial: GeneratePartialTestDataFn<CollaborationRequest> = defaultGeneratePartialTestDataFn
) {
  const items = generateCollaborationRequestListForTest(count, genPartial);
  await kIjxSemantic
    .utils()
    .withTxn(async opts =>
      kIjxSemantic.collaborationRequest().insertItem(items, opts)
    );
  return items;
}
