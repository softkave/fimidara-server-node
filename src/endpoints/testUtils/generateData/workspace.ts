import {faker} from '@faker-js/faker';
import {Agent, AppResourceTypeMap} from '../../../definitions/system';
import {UsageRecordCategoryMap} from '../../../definitions/usageRecord';
import {Workspace, WorkspaceBillStatusMap} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resource';
import {BaseContextType} from '../../contexts/types';
import {usageRecordConstants} from '../../usageRecords/constants';
import {transformUsageThresholInput} from '../../workspaces/addWorkspace/internalCreateWorkspace';
import {NewWorkspaceInput} from '../../workspaces/addWorkspace/types';
import {makeRootnameFromName} from '../../workspaces/utils';

export function generateTestUsageThresholdInputMap(
  threshold = usageRecordConstants.defaultTotalThresholdInUSD
): Required<NewWorkspaceInput>['usageThresholds'] {
  return {
    [UsageRecordCategoryMap.Storage]: {
      category: UsageRecordCategoryMap.Storage,
      budget: threshold,
    },
    // [UsageRecordCategoryMap.Request]: {
    //   category: UsageRecordCategoryMap.Request,
    //   budget: threshold,
    // },
    [UsageRecordCategoryMap.BandwidthIn]: {
      category: UsageRecordCategoryMap.BandwidthIn,
      budget: threshold,
    },
    [UsageRecordCategoryMap.BandwidthOut]: {
      category: UsageRecordCategoryMap.BandwidthOut,
      budget: threshold,
    },
    // [UsageRecordCategoryMap.DatabaseObject]: {
    //   category: UsageRecordCategoryMap.DatabaseObject,
    //   budget: threshold,
    // },
    [UsageRecordCategoryMap.Total]: {
      category: UsageRecordCategoryMap.Total,
      budget: threshold * Object.keys(UsageRecordCategoryMap).length,
    },
  };
}

export function generateTestWorkspace(seed: Partial<Workspace> = {}) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(AppResourceTypeMap.User),
    agentType: AppResourceTypeMap.User,
    agentTokenId: getNewIdForResource(AppResourceTypeMap.AgentToken),
  };
  const name = faker.company.name();
  const resourceId = getNewIdForResource(AppResourceTypeMap.Workspace);
  const workspace: Workspace = {
    createdAt,
    createdBy,
    name,
    resourceId,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: createdBy,
    workspaceId: resourceId,
    rootname: makeRootnameFromName(name),
    description: faker.lorem.sentence(),
    billStatus: WorkspaceBillStatusMap.Ok,
    billStatusAssignedAt: createdAt,
    usageThresholds: transformUsageThresholInput(
      createdBy,
      generateTestUsageThresholdInputMap()
    ),
    usageThresholdLocks: {},
    publicPermissionGroupId: getNewIdForResource(AppResourceTypeMap.PermissionGroup),
    ...seed,
  };
  return workspace;
}

export function generateWorkspaceListForTest(count = 20, seed: Partial<Workspace> = {}) {
  const workspaces: Workspace[] = [];
  for (let i = 0; i < count; i++) {
    workspaces.push(generateTestWorkspace());
  }
  return workspaces;
}

export async function generateAndInsertWorkspaceListForTest(
  ctx: BaseContextType,
  count = 20,
  extra: Partial<Workspace> = {}
) {
  const items = generateWorkspaceListForTest(count, extra);
  await ctx.semantic.utils.withTxn(ctx, async opts =>
    ctx.semantic.workspace.insertItem(items, opts)
  );
  return items;
}
