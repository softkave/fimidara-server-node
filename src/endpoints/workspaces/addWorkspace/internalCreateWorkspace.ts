import assert from 'assert';
import {kFileBackendType} from '../../../definitions/fileBackend.js';
import {
  Agent,
  SessionAgent,
  kFimidaraResourceType,
} from '../../../definitions/system.js';
import {UsageRecordCategory} from '../../../definitions/usageRecord.js';
import {
  UsageThresholdsByCategory,
  Workspace,
  kWorkspaceBillStatusMap,
} from '../../../definitions/workspace.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {cast} from '../../../utils/fns.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {assertIsNotOnWaitlist} from '../../../utils/sessionUtils.js';
import {
  addAssignedPermissionGroupList,
  assignWorkspaceToUser,
} from '../../assignedItems/addAssignedItems.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../contexts/semantic/types.js';
import {INTERNAL_addFileBackendMount} from '../../fileBackends/addMount/utils.js';
import {
  getDefaultThresholds,
  getUsageForCost,
} from '../../usageRecords/constants.js';
import {
  checkWorkspaceNameExists,
  checkWorkspaceRootnameExists,
} from '../checkWorkspaceExists.js';
import {NewWorkspaceInput} from './types.js';
import {generateDefaultWorkspacePermissionGroups} from './utils.js';

export function transformUsageThresholInput(
  agent: Agent,
  input: Required<NewWorkspaceInput>['usageThresholds']
) {
  const usageThresholds: UsageThresholdsByCategory = {};
  cast<UsageRecordCategory[]>(Object.keys(input)).forEach(category => {
    const usageThreshold = input[category];
    assert(usageThreshold);
    usageThresholds[category] = {
      ...usageThreshold,
      usage: getUsageForCost(category, usageThreshold.budget),
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: agent,
    };
  });

  return usageThresholds;
}

const INTERNAL_createWorkspace = async (
  data: NewWorkspaceInput,
  agent: SessionAgent,
  userId: string | undefined,
  opts: SemanticProviderMutationParams
) => {
  assertIsNotOnWaitlist(agent);
  await Promise.all([
    checkWorkspaceNameExists(data.name, opts),
    checkWorkspaceRootnameExists(data.rootname, opts),
  ]);

  // TODO: replace with user defined usage thresholds when we implement billing
  const usageThresholds = getDefaultThresholds();
  const createdAt = getTimestamp();
  const id = getNewIdForResource(kFimidaraResourceType.Workspace);
  const workspace: Workspace = {
    publicPermissionGroupId: '', // placeholder, filled in below
    billStatus: kWorkspaceBillStatusMap.ok,
    billStatusAssignedAt: createdAt,
    description: data.description,
    lastUpdatedAt: createdAt,
    rootname: data.rootname,
    lastUpdatedBy: agent,
    isDeleted: false,
    createdBy: agent,
    name: data.name,
    usageThresholds,
    workspaceId: id,
    resourceId: id,
    createdAt,
  };

  const {
    collaboratorPermissionGroup,
    publicPermissionGroup,
    adminPermissionGroup,
    permissionItems,
  } = generateDefaultWorkspacePermissionGroups(agent, workspace);
  workspace.publicPermissionGroupId = publicPermissionGroup.resourceId;
  await kSemanticModels.workspace().insertItem(workspace, opts);

  await Promise.all([
    INTERNAL_addFileBackendMount(
      agent,
      workspace,
      {
        backend: kFileBackendType.fimidara,
        name: kFileBackendType.fimidara,
        folderpath: workspace.rootname,
        mountedFrom: '',
        configId: null,
        index: 0,
      },
      opts
    ),
    kSemanticModels
      .permissionGroup()
      .insertItem(
        [
          collaboratorPermissionGroup,
          publicPermissionGroup,
          adminPermissionGroup,
        ],
        opts
      ),
    kSemanticModels.permissionItem().insertItem(permissionItems, opts),
    userId && assignWorkspaceToUser(agent, workspace.resourceId, userId, opts),
    userId &&
      addAssignedPermissionGroupList(
        agent,
        workspace.resourceId,
        [{permissionGroupId: adminPermissionGroup.resourceId}],
        userId,
        /** deleteExisting */ false,
        /** skipPermissionGroupsExistCheck */ true,
        /** skip auth check */ true,
        opts
      ),
  ]);

  return {workspace, adminPermissionGroup, publicPermissionGroup};
};

export default INTERNAL_createWorkspace;
