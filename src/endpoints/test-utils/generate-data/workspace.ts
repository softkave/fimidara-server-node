import {faker} from '@faker-js/faker';
import {IAgent, SessionAgentType} from '../../../definitions/system';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {IWorkspace, WorkspaceBillStatus} from '../../../definitions/workspace';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {costConstants} from '../../usageRecords/costs';
import {transformUsageThresholInput} from '../../workspaces/addWorkspace/internalCreateWorkspace';
import {INewWorkspaceInput} from '../../workspaces/addWorkspace/types';

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

  const workspace: IWorkspace = {
    createdAt,
    createdBy,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewId(),
    name: faker.lorem.word(),
    rootname: faker.lorem.words().split(' ').join('-'),
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
