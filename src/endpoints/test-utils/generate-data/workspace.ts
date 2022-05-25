import faker = require('faker');
import {IWorkspace, WorkspaceBillStatus} from '../../../definitions/workspace';
import {IAgent, SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {UsageRecordCategory} from '../../../definitions/usageRecord';

export function generateWorkspace() {
  const createdAt = getDateString();
  const createdBy: IAgent = {
    agentId: getNewId(),
    agentType: SessionAgentType.User,
  };

  const threshold = 1000;
  const workspace: IWorkspace = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewId(),
    name: faker.lorem.word(),
    description: faker.lorem.sentence(),
    publicPresetId: getNewId(),
    billStatus: WorkspaceBillStatus.Ok,
    billStatusAssignedAt: createdAt,
    usageThresholds: {
      [UsageRecordCategory.Storage]: {
        lastUpdatedBy: createdBy,
        lastUpdatedAt: createdAt,
        category: UsageRecordCategory.Storage,
        price: threshold,
      },
      [UsageRecordCategory.Request]: {
        lastUpdatedBy: createdBy,
        lastUpdatedAt: createdAt,
        category: UsageRecordCategory.Request,
        price: threshold,
      },
      [UsageRecordCategory.BandwidthIn]: {
        lastUpdatedBy: createdBy,
        lastUpdatedAt: createdAt,
        category: UsageRecordCategory.BandwidthIn,
        price: threshold,
      },
      [UsageRecordCategory.BandwidthOut]: {
        lastUpdatedBy: createdBy,
        lastUpdatedAt: createdAt,
        category: UsageRecordCategory.BandwidthOut,
        price: threshold,
      },
      [UsageRecordCategory.DatabaseObject]: {
        lastUpdatedBy: createdBy,
        lastUpdatedAt: createdAt,
        category: UsageRecordCategory.DatabaseObject,
        price: threshold,
      },
      ['total']: {
        lastUpdatedBy: createdBy,
        lastUpdatedAt: createdAt,
        category: 'total',
        price: threshold * 4,
      },
    },
    usageThresholdLocks: {},
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
