import {IAgent} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {IBaseContext} from '../../contexts/BaseContext';
import {checkWorkspaceNameExists} from '../checkWorkspaceNameExists';
import WorkspaceQueries from '../queries';
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
  let workspace = await context.data.workspace.saveItem({
    createdAt: getDateString(),
    createdBy: agent,
    name: data.name,
    resourceId: getNewId(),
    description: data.description,
  });

  const {adminPreset, publicPreset} = await setupDefaultWorkspacePresets(
    context,
    agent,
    workspace
  );

  workspace = await context.data.workspace.assertUpdateItem(
    WorkspaceQueries.getById(workspace.resourceId),
    {publicPresetId: publicPreset.resourceId}
  );

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
