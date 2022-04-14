import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {extractCollaborator} from '../extractCollaborator';
import {checkCollaboratorAuthorization02} from '../utils';
import {UpdateCollaboratorPresetsEndpoint} from './types';
import {updateCollaboratorPresetsJoiSchema} from './validation';

const updateCollaboratorPresets: UpdateCollaboratorPresetsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateCollaboratorPresetsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const {collaborator, workspace} = await checkCollaboratorAuthorization02(
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

  return {
    collaborator: await extractCollaborator(context, collaborator, workspaceId),
  };
};

export default updateCollaboratorPresets;
