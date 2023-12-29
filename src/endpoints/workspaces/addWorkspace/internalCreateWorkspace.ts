import assert = require('assert');
import {Agent, kAppResourceType} from '../../../definitions/system';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {
  UsageThresholdsByCategory,
  Workspace,
  WorkspaceBillStatusMap,
} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {cast} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';
import {assertIsNotOnWaitlist} from '../../../utils/sessionUtils';
import {
  addAssignedPermissionGroupList,
  assignWorkspaceToUser,
} from '../../assignedItems/addAssignedItems';
import {kSemanticModels} from '../../contexts/injectables';
import {SemanticProviderMutationRunOptions} from '../../contexts/semantic/types';
import {INTERNAL_addFileBackendMount} from '../../fileBackends/addMount/utils';
import {getDefaultThresholds} from '../../usageRecords/constants';
import {
  checkWorkspaceNameExists,
  checkWorkspaceRootnameExists,
} from '../checkWorkspaceExists';
import {NewWorkspaceInput} from './types';
import {generateDefaultWorkspacePermissionGroups} from './utils';

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
  agent: Agent,
  userId: string | undefined,
  opts: SemanticProviderMutationRunOptions
) => {
  assertIsNotOnWaitlist(agent);
  await Promise.all([
    checkWorkspaceNameExists(data.name, opts),
    checkWorkspaceRootnameExists(data.rootname, opts),
  ]);

  // TODO: replace with user defined usage thresholds when we implement billing
  const usageThresholds = getDefaultThresholds();
  const createdAt = getTimestamp();
  const id = getNewIdForResource(kAppResourceType.Workspace);
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
        folderpath: '',
        index: 0,
        mountedFrom: '',
        name: 'fimidara',
        backend: 'fimidara',
      },
      opts
    ),
    kSemanticModels
      .permissionGroup()
      .insertItem(
        [adminPermissionGroup, publicPermissionGroup, collaboratorPermissionGroup],
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
