import faker = require('faker');
import {IWorkspace, WorkspaceBillStatus} from '../../../definitions/workspace';
import {IAgent, SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {INewWorkspaceInput} from '../../workspaces/addWorkspace/types';
import {transformUsageThresholInput} from '../../workspaces/addWorkspace/internalCreateWorkspace';
import {costConstants} from '../../usageRecords/costs';

export function generateUsageThresholdMap(
  threshold = costConstants.defaultTotalThresholdInUSD
): Required<INewWorkspaceInput>['usageThresholds'] {
  return {
    [UsageRecordCategory.Storage]: {
      category: UsageRecordCategory.Storage,
      price: threshold,
    },
    [UsageRecordCategory.Request]: {
      category: UsageRecordCategory.Request,
      price: threshold,
    },
    [UsageRecordCategory.BandwidthIn]: {
      category: UsageRecordCategory.BandwidthIn,
      price: threshold,
    },
    [UsageRecordCategory.BandwidthOut]: {
      category: UsageRecordCategory.BandwidthOut,
      price: threshold,
    },
    [UsageRecordCategory.DatabaseObject]: {
      category: UsageRecordCategory.DatabaseObject,
      price: threshold,
    },
    ['total']: {
      category: 'total',
      price: threshold * Object.keys(UsageRecordCategory).length,
    },
  };
}

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
    billStatus: WorkspaceBillStatus.Ok,
    billStatusAssignedAt: createdAt,
    usageThresholds: transformUsageThresholInput(
      createdBy,
      generateUsageThresholdMap()
    ),
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
