import {faker} from '@faker-js/faker';
import {IAgent, SessionAgentType} from '../../../definitions/system';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {IWorkspace, WorkspaceBillStatus} from '../../../definitions/workspace';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {usageRecordConstants} from '../../usageRecords/constants';
import {transformUsageThresholInput} from '../../workspaces/addWorkspace/internalCreateWorkspace';
import {INewWorkspaceInput} from '../../workspaces/addWorkspace/types';
import {makeRootnameFromName} from '../../workspaces/utils';

export function generateTestUsageThresholdInputMap(
  threshold = usageRecordConstants.defaultTotalThresholdInUSD
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
    [UsageRecordCategory.Total]: {
      category: UsageRecordCategory.Total,
      price: threshold * Object.keys(UsageRecordCategory).length,
    },
  };
}

export function generateUsageThresholdInputMap02(
  thresholds: Partial<Record<UsageRecordCategory, number>> = {},
  fillRemaining: boolean = true
): Required<INewWorkspaceInput>['usageThresholds'] {
  const urs: Required<INewWorkspaceInput>['usageThresholds'] = {};
  Object.keys(UsageRecordCategory).forEach(key => {
    if (thresholds[key as UsageRecordCategory]) {
      urs[key as UsageRecordCategory] = {
        category: key as UsageRecordCategory,
        price: thresholds[key as UsageRecordCategory] as number,
      };
    } else if (fillRemaining) {
      urs[key as UsageRecordCategory] = {
        category: key as UsageRecordCategory,
        price: usageRecordConstants.defaultTotalThresholdInUSD,
      };
    }
  });

  return urs;
}

export function generateTestWorkspace() {
  const createdAt = getDateString();
  const createdBy: IAgent = {
    agentId: getNewId(),
    agentType: SessionAgentType.User,
  };

  const name = faker.company.companyName();
  const workspace: IWorkspace = {
    createdAt,
    createdBy,
    name,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewId(),
    rootname: makeRootnameFromName(name),
    description: faker.lorem.sentence(),
    billStatus: WorkspaceBillStatus.Ok,
    billStatusAssignedAt: createdAt,
    usageThresholds: transformUsageThresholInput(
      createdBy,
      generateTestUsageThresholdInputMap()
    ),
    usageThresholdLocks: {},
  };

  return workspace;
}

export function generateWorkspaces(count = 20) {
  const workspaces: IWorkspace[] = [];
  for (let i = 0; i < count; i++) {
    workspaces.push(generateTestWorkspace());
  }

  return workspaces;
}
