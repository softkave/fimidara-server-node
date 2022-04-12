import faker = require('faker');
import {IWorkspace} from '../../../definitions/workspace';
import {SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';

export function generateWorkspace() {
  const workspace: IWorkspace = {
    resourceId: getNewId(),
    createdBy: {
      agentId: getNewId(),
      agentType: SessionAgentType.User,
    },
    createdAt: getDateString(),
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
