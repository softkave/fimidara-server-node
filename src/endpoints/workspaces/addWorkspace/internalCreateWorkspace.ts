import {IAgent} from '../../../definitions/system';
import {UsageThresholdCategory} from '../../../definitions/usageRecord';
import {IUser} from '../../../definitions/user';
import {IWorkspace, WorkspaceBillStatus} from '../../../definitions/workspace';
import {getDate, getDateString} from '../../../utilities/dateFns';
import cast from '../../../utilities/fns';
import getNewId from '../../../utilities/getNewId';
import {IBaseContext} from '../../contexts/BaseContext';
import {checkWorkspaceNameExists} from '../checkWorkspaceNameExists';
import {assertWorkspace} from '../utils';
import {INewWorkspaceInput} from './types';
import {
  setupDefaultWorkspacePresets,
  addWorkspaceToUserAndAssignAdminPreset,
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
  await checkWorkspaceNameExists(context, data.name);
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
      resourceId: getNewId(),
      description: data.description,
      billStatus: WorkspaceBillStatus.Ok,
      billStatusAssignedAt: createdAt,
      usageThresholdLocks: {},
    });

  const {adminPreset, publicPreset} = await setupDefaultWorkspacePresets(
    context,
    agent,
    workspace
  );

  workspace = await context.cacheProviders.workspace.updateById(
    context,
    workspace.resourceId,
    {publicPresetId: publicPreset.resourceId}
  );
  assertWorkspace(workspace);

  if (user) {
    await addWorkspaceToUserAndAssignAdminPreset(
      context,
      user,
      workspace,
      adminPreset
    );
  }

  return {workspace, adminPreset, publicPreset};
};

export default internalCreateWorkspace;
