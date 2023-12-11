import {faker} from '@faker-js/faker';
import {PartialDeep} from 'type-fest';
import {Agent, AppResourceTypeMap} from '../../../definitions/system';
import {
  UsageRecordCategory,
  UsageRecordCategoryMap,
} from '../../../definitions/usageRecord';
import {
  UsageThresholdLocksByCategory,
  UsageThresholdsByCategory,
  Workspace,
  WorkspaceBillStatusMap,
} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {cast, isObjectEmpty} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injectables';
import {usageRecordConstants} from '../../usageRecords/constants';
import {transformUsageThresholInput} from '../../workspaces/addWorkspace/internalCreateWorkspace';
import {NewWorkspaceInput} from '../../workspaces/addWorkspace/types';
import {makeRootnameFromName} from '../../workspaces/utils';

function transformUsageThresholLocks(
  agent: Agent,
  input: PartialDeep<UsageThresholdLocksByCategory>
) {
  const locks: UsageThresholdLocksByCategory = {};
  cast<UsageRecordCategory[]>(Object.keys(input)).forEach(category => {
    const lock = input[category];
    locks[category] = {
      category,
      lastUpdatedAt: getTimestamp(),
      ...lock,
      locked: lock?.locked ?? false,
      lastUpdatedBy: {...agent, ...lock?.lastUpdatedBy},
    };
  });

  return locks;
}

export function generateTestUsageThresholdInputMap(
  threshold = usageRecordConstants.defaultTotalThresholdInUSD,
  seed: PartialDeep<UsageThresholdsByCategory> = {}
): Required<NewWorkspaceInput>['usageThresholds'] {
  return {
    [UsageRecordCategoryMap.Storage]: {
      category: UsageRecordCategoryMap.Storage,
      budget: seed.storage?.budget ?? threshold,
    },
    // [UsageRecordCategoryMap.Request]: {
    //   category: UsageRecordCategoryMap.Request,
    //   budget: threshold,
    // },
    [UsageRecordCategoryMap.BandwidthIn]: {
      category: UsageRecordCategoryMap.BandwidthIn,
      budget: seed.bin?.budget ?? threshold,
    },
    [UsageRecordCategoryMap.BandwidthOut]: {
      category: UsageRecordCategoryMap.BandwidthOut,
      budget: seed.bout?.budget ?? threshold,
    },
    // [UsageRecordCategoryMap.DatabaseObject]: {
    //   category: UsageRecordCategoryMap.DatabaseObject,
    //   budget: threshold,
    // },
    [UsageRecordCategoryMap.Total]: isObjectEmpty(seed)
      ? {
          category: UsageRecordCategoryMap.Total,
          budget: threshold * Object.keys(UsageRecordCategoryMap).length,
        }
      : {
          category: UsageRecordCategoryMap.Total,
          budget:
            seed.total?.budget ??
            Object.values(seed).reduce((sum, next) => sum + (next?.budget ?? 0), 0),
        },
  };
}

export function generateTestWorkspace(seed: PartialDeep<Workspace> = {}) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentId: getNewIdForResource(AppResourceTypeMap.User),
    agentType: AppResourceTypeMap.User,
    agentTokenId: getNewIdForResource(AppResourceTypeMap.AgentToken),
    ...seed.createdBy,
  };
  const lastUpdatedBy: Agent = {...createdBy, ...seed.lastUpdatedBy};
  const name = faker.company.name();
  const resourceId = getNewIdForResource(AppResourceTypeMap.Workspace);

  const workspace: Workspace = {
    createdAt,
    name,
    resourceId,
    lastUpdatedAt: createdAt,
    workspaceId: resourceId,
    rootname: makeRootnameFromName(name),
    description: faker.lorem.sentence(),
    billStatus: WorkspaceBillStatusMap.Ok,
    billStatusAssignedAt: createdAt,
    publicPermissionGroupId: getNewIdForResource(AppResourceTypeMap.PermissionGroup),
    ...seed,
    createdBy,
    lastUpdatedBy,
    usageThresholdLocks: transformUsageThresholLocks(
      createdBy,
      seed.usageThresholdLocks || {}
    ),
    usageThresholds: transformUsageThresholInput(
      createdBy,
      generateTestUsageThresholdInputMap(
        usageRecordConstants.defaultTotalThresholdInUSD,
        seed.usageThresholds
      )
    ),
  };
  return workspace;
}

export function generateWorkspaceListForTest(count = 20, seed: Partial<Workspace> = {}) {
  const workspaces: Workspace[] = [];
  for (let i = 0; i < count; i++) {
    workspaces.push(generateTestWorkspace(seed));
  }
  return workspaces;
}

export async function generateAndInsertWorkspaceListForTest(
  count = 20,
  extra: Partial<Workspace> = {}
) {
  const items = generateWorkspaceListForTest(count, extra);
  await kSemanticModels
    .utils()
    .withTxn(async opts => kSemanticModels.workspace().insertItem(items, opts));
  return items;
}
