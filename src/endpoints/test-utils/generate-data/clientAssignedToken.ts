import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {IAgent, SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {CURRENT_TOKEN_VERSION} from '../../contexts/SessionContext';

export function generateClientAssignedTokenForTest() {
  const createdAt = getDateString();
  const createdBy: IAgent = {
    agentId: getNewId(),
    agentType: SessionAgentType.User,
  };

  const token: IClientAssignedToken = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewId(),
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
