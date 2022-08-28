import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  IAgent,
  SessionAgentType,
} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {getNewIdForResource} from '../../../utilities/resourceId';

export function generateClientAssignedTokenForTest() {
  const createdAt = getDateString();
  const createdBy: IAgent = {
    agentId: getNewIdForResource(AppResourceType.User),
    agentType: SessionAgentType.User,
  };

  const token: IClientAssignedToken = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(AppResourceType.ClientAssignedToken),
    workspaceId: getNewIdForResource(AppResourceType.Workspace),
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
