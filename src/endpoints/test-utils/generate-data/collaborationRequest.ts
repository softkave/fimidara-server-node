import {faker} from '@faker-js/faker';
import {ICollaborationRequest} from '../../../definitions/collaborationRequest';
import {
  AppResourceType,
  IAgent,
  SessionAgentType,
} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {getNewIdForResource} from '../../../utilities/resourceId';
import {
  defaultGenPartialTestDataFn,
  generateTestList,
  GenPartialTestDataFn,
} from './utils';

export function generateCollaborationRequestForTest() {
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
  };

  return item;
}

export function generateCollaborationRequestListForTest(
  count = 20,
  genPartial: GenPartialTestDataFn<ICollaborationRequest> = defaultGenPartialTestDataFn
) {
  return generateTestList(
    generateCollaborationRequestForTest,
    count,
    genPartial
  );
}
