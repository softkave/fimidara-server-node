import * as faker from 'faker';
import {ICollaborationRequest} from '../../../definitions/collaborationRequest';
import {IAgent, SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {
  defaultGenPartialTestDataFn,
  generateTestList,
  GenPartialTestDataFn,
} from './utils';

export function generateCollaborationRequestForTest() {
  const createdAt = getDateString();
  const createdBy: IAgent = {
    agentId: getNewId(),
    agentType: SessionAgentType.User,
  };

  const item: ICollaborationRequest = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewId(),
    workspaceName: faker.company.companyName(),
    workspaceId: getNewId(),
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
