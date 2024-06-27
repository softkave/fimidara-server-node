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
  WorkspaceBillStatusMap,
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
import {getDefaultThresholds} from '../../usageRecords/constants.js';
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
      lastUpdatedBy: agent,
      lastUpdatedAt: getTimestamp(),
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
    createdAt,
    usageThresholds,
    createdBy: agent,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: agent,
    name: data.name,
    rootname: data.rootname,
    resourceId: id,
    workspaceId: id,
    description: data.description,
    billStatus: WorkspaceBillStatusMap.Ok,
    billStatusAssignedAt: createdAt,
    usageThresholdLocks: {},
    publicPermissionGroupId: '', // placeholder
    isDeleted: false,
  };

  const {
    adminPermissionGroup,
    publicPermissionGroup,
    collaboratorPermissionGroup,
    permissionItems,
  } = generateDefaultWorkspacePermissionGroups(agent, workspace);
  workspace.publicPermissionGroupId = publicPermissionGroup.resourceId;
  await kSemanticModels.workspace().insertItem(workspace, opts);

  await Promise.all([
    INTERNAL_addFileBackendMount(
      agent,
      workspace,
      {
        configId: null,
        folderpath: workspace.rootname,
        index: 0,
        mountedFrom: '',
        name: kFileBackendType.fimidara,
        backend: kFileBackendType.fimidara,
      },
      opts
    ),
    kSemanticModels
      .permissionGroup()
      .insertItem(
        [
          adminPermissionGroup,
          publicPermissionGroup,
          collaboratorPermissionGroup,
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
