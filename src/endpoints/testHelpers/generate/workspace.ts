import {faker} from '@faker-js/faker';
import {PartialDeep} from 'type-fest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {Agent, kFimidaraResourceType} from '../../../definitions/system.js';
import {kUsageRecordCategory} from '../../../definitions/usageRecord.js';
import {
  UsageThresholdsByCategory,
  Workspace,
  kWorkspaceBillStatusMap,
} from '../../../definitions/workspace.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {isObjectEmpty} from '../../../utils/fns.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {kUsageRecordConstants} from '../../usageRecords/constants.js';
import {transformUsageThresholInput} from '../../workspaces/addWorkspace/internalCreateWorkspace.js';
import {NewWorkspaceInput} from '../../workspaces/addWorkspace/types.js';
import {makeRootnameFromName} from '../../workspaces/utils.js';

export function generateTestUsageThresholdInputMap(
  threshold = kUsageRecordConstants.defaultTotalThresholdInUSD,
  seed: PartialDeep<UsageThresholdsByCategory> = {}
): Required<NewWorkspaceInput>['usageThresholds'] {
  return {
    [kUsageRecordCategory.storage]: {
      budget: seed.storage?.budget ?? threshold,
      category: kUsageRecordCategory.storage,
    },
    // [UsageRecordCategoryMap.Request]: {
    //   category: UsageRecordCategoryMap.Request,
    //   budget: threshold,
    // },
    [kUsageRecordCategory.bandwidthIn]: {
      category: kUsageRecordCategory.bandwidthIn,
      budget: seed.bin?.budget ?? threshold,
    },
    [kUsageRecordCategory.bandwidthOut]: {
      category: kUsageRecordCategory.bandwidthOut,
      budget: seed.bout?.budget ?? threshold,
    },
    // [UsageRecordCategoryMap.DatabaseObject]: {
    //   category: UsageRecordCategoryMap.DatabaseObject,
    //   budget: threshold,
    // },
    [kUsageRecordCategory.total]: isObjectEmpty(seed)
      ? {
          budget: threshold * Object.keys(kUsageRecordCategory).length,
          category: kUsageRecordCategory.total,
        }
      : {
          category: kUsageRecordCategory.total,
          budget:
            seed.total?.budget ??
            Object.values(seed).reduce(
              (sum, next) => sum + (next?.budget ?? 0),
              /** initialValue */ 0
            ),
        },
  };
}

export function generateTestWorkspace(seed: Partial<Workspace> = {}) {
  const createdAt = getTimestamp();
  const createdBy: Agent = {
    agentTokenId: getNewIdForResource(kFimidaraResourceType.AgentToken),
    agentId: getNewIdForResource(kFimidaraResourceType.User),
    agentType: kFimidaraResourceType.User,
    ...seed.createdBy,
  };
  const lastUpdatedBy: Agent = {...createdBy, ...seed.lastUpdatedBy};
  const name = faker.company.name();
  const resourceId =
    seed.resourceId ||
    seed.workspaceId ||
    getNewIdForResource(kFimidaraResourceType.Workspace);

  const workspace: Workspace = {
    usageThresholds: transformUsageThresholInput(
      createdBy,
      generateTestUsageThresholdInputMap(
        kUsageRecordConstants.defaultTotalThresholdInUSD,
        seed.usageThresholds
      )
    ),
    publicPermissionGroupId: getNewIdForResource(
      kFimidaraResourceType.PermissionGroup
    ),
    billStatus: kWorkspaceBillStatusMap.ok,
    rootname: makeRootnameFromName(name),
    description: faker.lorem.sentence(),
    billStatusAssignedAt: createdAt,
    lastUpdatedAt: createdAt,
    workspaceId: resourceId,
    isDeleted: false,
    lastUpdatedBy,
    resourceId,
    createdAt,
    createdBy,
    name,
    ...seed,
  };

  return workspace;
}

export function generateWorkspaceListForTest(
  count = 20,
  seed: Partial<Workspace> = {}
) {
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
  await kIjxSemantic
    .utils()
    .withTxn(async opts => kIjxSemantic.workspace().insertItem(items, opts));

  return items;
}
