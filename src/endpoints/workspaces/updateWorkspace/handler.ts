import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {checkWorkspaceNameExists} from '../checkWorkspaceNameExists';
import WorkspaceQueries from '../queries';
import {checkWorkspaceAuthorization02, workspaceExtractor} from '../utils';
import {UpdateWorkspaceEndpoint} from './types';
import {updateWorkspaceJoiSchema} from './validation';

const updateWorkspace: UpdateWorkspaceEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateWorkspaceJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const {workspace} = await checkWorkspaceAuthorization02(
    context,
    agent,
    workspaceId,
    BasicCRUDActions.Update
  );

  if (data.workspace.name) {
    await checkWorkspaceNameExists(context, data.workspace.name);
  }

  const updatedWorkspace = await context.data.workspace.assertUpdateItem(
    WorkspaceQueries.getById(workspace.resourceId),
    {
      ...data.workspace,
      lastUpdatedAt: getDateString(),
      lastUpdatedBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
    }
  );

  return {workspace: workspaceExtractor(updatedWorkspace)};
};

export default updateWorkspace;
