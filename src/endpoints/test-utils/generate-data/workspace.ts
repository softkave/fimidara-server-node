import {faker} from '@faker-js/faker';
import {
  AppResourceType,
  IAgent,
  SessionAgentType,
} from '../../../definitions/system';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {IWorkspace, WorkspaceBillStatus} from '../../../definitions/workspace';
import {getDateString} from '../../../utilities/dateFns';
import {getNewIdForResource} from '../../../utilities/resourceId';
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
      budget: threshold,
    },
    // [UsageRecordCategory.Request]: {
    //   category: UsageRecordCategory.Request,
    //   budget: threshold,
    // },
    [UsageRecordCategory.BandwidthIn]: {
      category: UsageRecordCategory.BandwidthIn,
      budget: threshold,
    },
    [UsageRecordCategory.BandwidthOut]: {
      category: UsageRecordCategory.BandwidthOut,
      budget: threshold,
    },
    // [UsageRecordCategory.DatabaseObject]: {
    //   category: UsageRecordCategory.DatabaseObject,
    //   budget: threshold,
    // },
    [UsageRecordCategory.Total]: {
      category: UsageRecordCategory.Total,
      budget: threshold * Object.keys(UsageRecordCategory).length,
    },
  };
}

export function generateTestWorkspace() {
  const createdAt = getDateString();
  const createdBy: IAgent = {
    agentId: getNewIdForResource(AppResourceType.User),
    agentType: SessionAgentType.User,
  };

  const name = faker.company.name();
  const workspace: IWorkspace = {
    createdAt,
    createdBy,
    name,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    resourceId: getNewIdForResource(AppResourceType.Workspace),
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

export function generateTestWorkspaces(count = 20) {
  const workspaces: IWorkspace[] = [];
  for (let i = 0; i < count; i++) {
    workspaces.push(generateTestWorkspace());
  }

  return workspaces;
}
