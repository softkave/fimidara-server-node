import {AppActionType} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkWorkspaceNameExists} from '../checkWorkspaceExists';
import {assertWorkspace, checkWorkspaceAuthorization02, workspaceExtractor} from '../utils';
import {UpdateWorkspaceEndpoint} from './types';
import {updateWorkspaceJoiSchema} from './validation';

const updateWorkspace: UpdateWorkspaceEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateWorkspaceJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  let {workspace} = await checkWorkspaceAuthorization02(
    context,
    agent,
    AppActionType.Update,
    data.workspaceId
  );

  workspace = await context.semantic.utils.withTxn(context, async opts => {
    await Promise.all([
      data.workspace.name && data.workspace.name !== workspace.name
        ? checkWorkspaceNameExists(context, data.workspace.name, opts)
        : undefined,
    ]);
    const update: Partial<Workspace> = {
      ...data.workspace,
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    };
    const updatedWorkspace = await context.semantic.workspace.getAndUpdateOneById(
      workspace.resourceId,
      update,
      opts
    );
    assertWorkspace(updatedWorkspace);
    return updatedWorkspace;
  });

  return {workspace: workspaceExtractor(workspace)};
};

export default updateWorkspace;
