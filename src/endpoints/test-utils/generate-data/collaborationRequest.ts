import * as faker from 'faker';
import {ICollaborationRequest} from '../../../definitions/collaborationRequest';
import {SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {
  defaultGenPartialTestDataFn,
  generateTestList,
  GenPartialTestDataFn,
} from './utils';

export function generateCollaborationRequestForTest() {
  const item: ICollaborationRequest = {
    resourceId: getNewId(),
    createdAt: getDateString(),
    createdBy: {
      agentId: getNewId(),
      agentType: SessionAgentType.User,
    },
    organizationName: faker.company.companyName(),
    organizationId: getNewId(),
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
