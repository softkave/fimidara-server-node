import assert = require('assert');
import {AppResourceType, IAgent} from '../../../definitions/system';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {IWorkspace, WorkspaceBillStatus} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {cast} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {
  addAssignedPermissionGroupList,
  assignWorkspaceToUser,
} from '../../assignedItems/addAssignedItems';
import {ISemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {IBaseContext} from '../../contexts/types';
import {getDefaultThresholds} from '../../usageRecords/constants';
import {checkWorkspaceNameExists, checkWorkspaceRootnameExists} from '../checkWorkspaceExists';
import {INewWorkspaceInput} from './types';
import {generateDefaultWorkspacePermissionGroups} from './utils';

export function transformUsageThresholInput(
  agent: IAgent,
  input: Required<INewWorkspaceInput>['usageThresholds']
) {
  const usageThresholds: IWorkspace['usageThresholds'] = {};
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

const internalCreateWorkspace = async (
  context: IBaseContext,
  data: INewWorkspaceInput,
  agent: IAgent,
  userId: string | undefined,
  opts: ISemanticDataAccessProviderMutationRunOptions
) => {
  await Promise.all([
    checkWorkspaceNameExists(context, data.name, opts),
    checkWorkspaceRootnameExists(context, data.rootname, opts),
  ]);

  // TODO: replace with user defined usage thresholds when we implement billing
  const usageThresholds = getDefaultThresholds();
  const createdAt = getTimestamp();
  const id = getNewIdForResource(AppResourceType.Workspace);
  const workspace: IWorkspace | null = {
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
        opts
      ),
  ]);

  return {workspace, adminPermissionGroup, publicPermissionGroup};
};

export default internalCreateWorkspace;
