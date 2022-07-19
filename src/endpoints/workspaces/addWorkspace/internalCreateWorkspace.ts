import {IAgent} from '../../../definitions/system';
import {UsageThresholdCategory} from '../../../definitions/usageRecord';
import {IUser} from '../../../definitions/user';
import {IWorkspace, WorkspaceBillStatus} from '../../../definitions/workspace';
import {getDate, getDateString} from '../../../utilities/dateFns';
import cast from '../../../utilities/fns';
import getNewId from '../../../utilities/getNewId';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  checkWorkspaceNameExists,
  checkWorkspaceRootnameExists,
} from '../checkWorkspaceNameExists';
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
  cast<UsageThresholdCategory[]>(Object.keys(input)).forEach(category => {
    const usageThreshold = input[category]!;
    usageThresholds[category] = {
      ...usageThreshold,
      lastUpdatedBy: agent,
      lastUpdatedAt: getDate(),
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
  const createdAt = getDateString();
  const usageThresholds = transformUsageThresholInput(
    agent,
    data.usageThresholds || {}
  );

  let workspace: IWorkspace | null =
    await context.cacheProviders.workspace.insert(context, {
      createdAt,
      usageThresholds,
      createdBy: agent,
      lastUpdatedAt: createdAt,
      lastUpdatedBy: agent,
      name: data.name,
      rootname: data.rootname,
      resourceId: getNewId(),
      description: data.description,
      billStatus: WorkspaceBillStatus.Ok,
      billStatusAssignedAt: createdAt,
      usageThresholdLocks: {},
    });

  const {adminPermissionGroup, publicPermissionGroup} =
    await setupDefaultWorkspacePermissionGroups(context, agent, workspace);

  workspace = await context.cacheProviders.workspace.updateById(
    context,
    workspace.resourceId,
    {publicPermissionGroupId: publicPermissionGroup.resourceId}
  );
  assertWorkspace(workspace);

  if (user) {
    await addWorkspaceToUserAndAssignAdminPermissionGroup(
      context,
      user,
      workspace,
      adminPermissionGroup
    );
  }

  return {workspace, adminPermissionGroup, publicPermissionGroup};
};

export default internalCreateWorkspace;
