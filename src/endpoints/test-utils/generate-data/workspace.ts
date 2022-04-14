import faker = require('faker');
import {IWorkspace} from '../../../definitions/workspace';
import {IAgent, SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';

export function generateWorkspace() {
  const createdAt = getDateString();
  const createdBy: IAgent = {
    agentId: getNewId(),
    agentType: SessionAgentType.User,
  };

  const workspace: IWorkspace = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewId(),
    name: faker.lorem.word(),
  };

  return workspace;
}

export function generateWorkspaces(count = 20) {
  const workspaces: IWorkspace[] = [];
  for (let i = 0; i < count; i++) {
    workspaces.push(generateWorkspace());
  }
  return workspaces;
}
