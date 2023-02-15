import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {getWorkspaceIdFromSessionAgent} from '../../contexts/SessionContext';
import {extractCollaborator} from '../extractCollaborator';
import {checkCollaboratorAuthorization02} from '../utils';
import {UpdateCollaboratorPermissionGroupsEndpoint} from './types';
import {updateCollaboratorPermissionGroupsJoiSchema} from './validation';

const updateCollaboratorPermissionGroups: UpdateCollaboratorPermissionGroupsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateCollaboratorPermissionGroupsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
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
    /** deleteExisting */ true
  );

  return {
    collaborator: await extractCollaborator(context, collaborator, workspaceId),
  };
};

export default updateCollaboratorPermissionGroups;
