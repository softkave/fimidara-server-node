import assert = require('assert');
import {AppResourceType, IAgent} from '../../../definitions/system';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {IUser} from '../../../definitions/user';
import {IWorkspace, WorkspaceBillStatus} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {cast} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {IBaseContext} from '../../contexts/types';
import {getDefaultThresholds} from '../../usageRecords/constants';
import {checkWorkspaceNameExists, checkWorkspaceRootnameExists} from '../checkWorkspaceExists';
import {assertWorkspace} from '../utils';
import {INewWorkspaceInput} from './types';
import {
  addWorkspaceToUserAndAssignAdminPermissionGroup,
  setupDefaultWorkspacePermissionGroups,
} from './utils';

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
  user?: IUser
) => {
  await Promise.all([
    checkWorkspaceNameExists(context, data.name),
    checkWorkspaceRootnameExists(context, data.rootname),
  ]);

  const createdAt = getTimestamp();

  // TODO: replace with user defined usage thresholds when we implement billing
  const usageThresholds = getDefaultThresholds();
  const id = getNewIdForResource(AppResourceType.Workspace);
  let workspace: IWorkspace | null = {
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
  await context.semantic.workspace.insertItem(workspace);

  const {adminPermissionGroup, publicPermissionGroup} = await setupDefaultWorkspacePermissionGroups(
    context,
    agent,
    workspace
  );
  workspace = await context.semantic.workspace.getAndUpdateOneById(workspace.resourceId, {
    publicPermissionGroupId: publicPermissionGroup.resourceId,
  });
  assertWorkspace(workspace);

  if (user) {
    await addWorkspaceToUserAndAssignAdminPermissionGroup(
      context,
      agent,
      user,
      workspace,
      adminPermissionGroup
    );
  }

  return {workspace, adminPermissionGroup, publicPermissionGroup};
};

export default internalCreateWorkspace;
