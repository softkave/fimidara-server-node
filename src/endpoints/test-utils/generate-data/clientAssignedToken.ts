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
    workspaceId: getNewId(),
    version: CURRENT_TOKEN_VERSION,
    issuedAt: getDateString(),
  };

  return token;
}

export function generateClientAssignedTokenListForTest(count = 20) {
  const workspaces: IClientAssignedToken[] = [];
  for (let i = 0; i < count; i++) {
    workspaces.push(generateClientAssignedTokenForTest());
  }
  return workspaces;
}
