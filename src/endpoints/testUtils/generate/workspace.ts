import {faker} from '@faker-js/faker';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {Agent, kFimidaraResourceType} from '../../../definitions/system.js';
import {
  IRootLevelWorkspaceData,
  Workspace,
  kWorkspaceBillStatusMap,
} from '../../../definitions/workspace.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {getDefaultThresholds} from '../../usage/constants.js';
import {makeRootnameFromName} from '../../workspaces/utils.js';
import {GenerateResourceSeed} from './types.js';
import {getSeedData} from './utils.js';

export function generateTestWorkspace(
  seedOrFn: GenerateResourceSeed<Partial<Workspace>> = {}
) {
  const seed = getSeedData(seedOrFn);

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

  const workspace: Workspace & IRootLevelWorkspaceData = {
    usageThresholds: getDefaultThresholds(),
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
  seedOrFn: GenerateResourceSeed<Partial<Workspace>> = {}
) {
  const workspaces: Workspace[] = [];

  for (let i = 0; i < count; i++) {
    workspaces.push(generateTestWorkspace(seedOrFn));
  }

  return workspaces;
}

export async function generateAndInsertWorkspaceListForTest(
  count = 20,
  seedOrFn: GenerateResourceSeed<Partial<Workspace>> = {}
) {
  const items = generateWorkspaceListForTest(count, seedOrFn);
  await kSemanticModels
    .utils()
    .withTxn(async opts => kSemanticModels.workspace().insertItem(items, opts));

  return items;
}
