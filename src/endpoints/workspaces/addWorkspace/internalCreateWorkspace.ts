import {IAgent} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {
  ITotalUsageThreshold,
  IUsageThreshold,
  IWorkspace,
  WorkspaceBillStatus,
} from '../../../definitions/workspace';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {IBaseContext} from '../../contexts/BaseContext';
import {usageCosts} from '../../usageRecords/costs';
import {checkWorkspaceNameExists} from '../checkWorkspaceNameExists';
import {assertWorkspace} from '../utils';
import {INewWorkspaceInput} from './types';
import {
  setupDefaultWorkspacePresets,
  addWorkspaceToUserAndAssignAdminPreset,
} from './utils';

const internalCreateWorkspace = async (
  context: IBaseContext,
  data: INewWorkspaceInput,
  agent: IAgent,
  user?: IUser
) => {
  await checkWorkspaceNameExists(context, data.name);
  const createdAt = getDateString();
  let totalUsageThreshold: ITotalUsageThreshold | undefined = undefined;
  let usageThresholdList: IUsageThreshold[] = [];

  if (data.totalUsageThreshold) {
    totalUsageThreshold = {
      ...data.totalUsageThreshold,
      lastUpdatedAt: createdAt,
      lastUpdatedBy: agent,
    };
  }

  if (data.usageThresholds) {
    // TODO: validate that price or usage exists
    // TODO: do same and update in updateWorkspace endpoint
    usageThresholdList = data.usageThresholds.map(threshold => ({
      ...threshold,
      lastUpdatedAt: createdAt,
      lastUpdatedBy: agent,
      pricePerUnit: usageCosts[threshold.label],
    }));
  }

  let workspace: IWorkspace | null =
    await context.cacheProviders.workspace.insert(context, {
      createdAt,
      totalUsageThreshold,
      usageThresholds: usageThresholdList,
      createdBy: agent,
      lastUpdatedAt: createdAt,
      lastUpdatedBy: agent,
      name: data.name,
      resourceId: getNewId(),
      description: data.description,
      billStatus: WorkspaceBillStatus.Ok,
      billStatusAssignedAt: createdAt,
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
