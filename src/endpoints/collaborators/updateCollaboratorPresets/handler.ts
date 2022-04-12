import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {withUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {
  checkCollaboratorAuthorization02,
  collaboratorExtractor,
  removeOtherUserWorkspaces,
} from '../utils';
import {UpdateCollaboratorPresetsEndpoint} from './types';
import {updateCollaboratorPresetsJoiSchema} from './validation';

const updateCollaboratorPresets: UpdateCollaboratorPresetsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateCollaboratorPresetsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  let {collaborator, workspace} = await checkCollaboratorAuthorization02(
    context,
    agent,
    workspaceId,
    data.collaboratorId,
    BasicCRUDActions.Update
  );

  await saveResourceAssignedItems(
    context,
    agent,
    workspace,
    collaborator.resourceId,
    AppResourceType.User,
    data,
    true
  );

  collaborator = await withUserWorkspaces(context, collaborator);
  const publicData = collaboratorExtractor(
    removeOtherUserWorkspaces(collaborator, workspaceId),
    workspaceId
  );

  return {
    collaborator: publicData,
  };
};

export default updateCollaboratorPresets;
