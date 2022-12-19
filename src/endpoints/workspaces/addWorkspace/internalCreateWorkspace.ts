import assert = require('assert');
import {AppResourceType, IAgent} from '../../../definitions/system';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {IUser} from '../../../definitions/user';
import {IWorkspace, WorkspaceBillStatus} from '../../../definitions/workspace';
import {getDate, getDateString} from '../../../utils/dateFns';
import {cast} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {IBaseContext} from '../../contexts/types';
import {getDefaultThresholds} from '../../usageRecords/constants';
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
  cast<UsageRecordCategory[]>(Object.keys(input)).forEach(category => {
    const usageThreshold = input[category];
    assert(usageThreshold);
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
  // const usageThresholds = transformUsageThresholInput(
  //   agent,
  //   data.usageThresholds || {}
  // );

  // TODO: replace with user defined usage thresholds when we implement billing
  const usageThresholds = getDefaultThresholds();
  let workspace: IWorkspace | null =
    await context.cacheProviders.workspace.insert(context, {
      createdAt,
      usageThresholds,
      createdBy: agent,
      lastUpdatedAt: createdAt,
      lastUpdatedBy: agent,
      name: data.name,
      rootname: data.rootname,
      resourceId: getNewIdForResource(AppResourceType.Workspace),
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
