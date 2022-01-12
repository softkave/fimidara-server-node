import faker = require('faker');
import {IOrganization} from '../../../definitions/organization';
import {SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';

export function generateOrganization() {
  const org: IOrganization = {
    resourceId: getNewId(),
    createdBy: {
      agentId: getNewId(),
      agentType: SessionAgentType.User,
    },
    createdAt: getDateString(),
    name: faker.lorem.word(),
  };

  return org;
}

export function generateOrganizations(count = 20) {
  const orgs: IOrganization[] = [];
  for (let i = 0; i < count; i++) {
    orgs.push(generateOrganization());
  }
  return orgs;
}
