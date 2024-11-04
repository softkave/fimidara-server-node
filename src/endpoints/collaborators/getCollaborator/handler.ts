import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {
  checkCollaboratorAuthorization02,
  collaboratorExtractor,
} from '../utils.js';
import {GetCollaboratorEndpoint} from './types.js';
import {getCollaboratorJoiSchema} from './validation.js';

const getCollaboratorEndpoint: GetCollaboratorEndpoint = async reqData => {
  const data = validate(reqData.data, getCollaboratorJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData, {data});

  const {collaborator} = await checkCollaboratorAuthorization02(
    agent,
    workspaceId,
    data.collaboratorId,
    kFimidaraPermissionActions.readCollaborator
  );

  return {
    collaborator: collaboratorExtractor(collaborator),
  };
};

export default getCollaboratorEndpoint;
