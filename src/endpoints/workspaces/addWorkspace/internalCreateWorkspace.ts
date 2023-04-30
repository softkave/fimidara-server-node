import assert = require('assert');
import {Agent, AppResourceType} from '../../../definitions/system';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {Workspace, WorkspaceBillStatus} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {cast} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';
import {assertIsNotOnWaitlist} from '../../../utils/sessionUtils';
import {
  addAssignedPermissionGroupList,
  assignWorkspaceToUser,
} from '../../assignedItems/addAssignedItems';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';
import {getDefaultThresholds} from '../../usageRecords/constants';
import {checkWorkspaceNameExists, checkWorkspaceRootnameExists} from '../checkWorkspaceExists';
import {NewWorkspaceInput} from './types';
import {generateDefaultWorkspacePermissionGroups} from './utils';

export function transformUsageThresholInput(
  agent: Agent,
  input: Required<NewWorkspaceInput>['usageThresholds']
) {
  const usageThresholds: Workspace['usageThresholds'] = {};
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
  context: BaseContextType,
  data: NewWorkspaceInput,
  agent: Agent,
  userId: string | undefined,
  opts: SemanticDataAccessProviderMutationRunOptions
) => {
  assertIsNotOnWaitlist(agent);
  await Promise.all([
    checkWorkspaceNameExists(context, data.name, opts),
    checkWorkspaceRootnameExists(context, data.rootname, opts),
  ]);

  // TODO: replace with user defined usage thresholds when we implement billing
  const usageThresholds = getDefaultThresholds();
  const createdAt = getTimestamp();
  const id = getNewIdForResource(AppResourceType.Workspace);
  const workspace: Workspace | null = {
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
    billStatus: WorkspaceBillStatus.Ok,
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

  await Promise.all([
    context.semantic.workspace.insertItem(workspace, opts),
    context.semantic.permissionGroup.insertItem(
      [adminPermissionGroup, publicPermissionGroup, collaboratorPermissionGroup],
      opts
    ),
    context.semantic.permissionItem.insertItem(permissionItems, opts),
    userId && assignWorkspaceToUser(context, agent, workspace.resourceId, userId, opts),
    userId &&
      addAssignedPermissionGroupList(
        context,
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
