import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {CURRENT_TOKEN_VERSION} from '../../contexts/SessionContext';

export function generateClientAssignedTokenForTest() {
  const token: IClientAssignedToken = {
    resourceId: getNewId(),
    createdAt: getDateString(),
    createdBy: {
      agentId: getNewId(),
      agentType: SessionAgentType.User,
    },
    organizationId: getNewId(),
    version: CURRENT_TOKEN_VERSION,
    presets: [],
    issuedAt: getDateString(),
  };

  return token;
}

export function generateClientAssignedTokenListForTest(count = 20) {
  const orgs: IClientAssignedToken[] = [];
  for (let i = 0; i < count; i++) {
    orgs.push(generateClientAssignedTokenForTest());
  }
  return orgs;
}
