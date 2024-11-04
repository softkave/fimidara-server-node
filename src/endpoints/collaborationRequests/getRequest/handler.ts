import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {
  checkCollaborationRequestAuthorization02,
  collaborationRequestForWorkspaceExtractor,
} from '../utils.js';
import {GetCollaborationRequestEndpoint} from './types.js';
import {getCollaborationRequestJoiSchema} from './validation.js';

const getCollaborationRequestEndpoint: GetCollaborationRequestEndpoint =
  async reqData => {
    const data = validate(reqData.data, getCollaborationRequestJoiSchema);
    const {agent, workspaceId} = await initEndpoint(reqData, {data});

    const {request} = await checkCollaborationRequestAuthorization02({
      agent,
      workspaceId,
      requestId: data.requestId,
      action: kFimidaraPermissionActions.readCollaborationRequest,
    });

    return {request: collaborationRequestForWorkspaceExtractor(request)};
  };

export default getCollaborationRequestEndpoint;
