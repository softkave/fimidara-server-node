import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {
  checkCollaborationRequestAuthorization02,
  collaborationRequestForWorkspaceExtractor,
  populateRequestAssignedPermissionGroups,
} from '../utils';
import {GetWorkspaceCollaborationRequestEndpoint} from './types';
import {getWorkspaceCollaborationRequestJoiSchema} from './validation';

const getWorkspaceCollaborationRequest: GetWorkspaceCollaborationRequestEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getWorkspaceCollaborationRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {request} = await checkCollaborationRequestAuthorization02(
    context,
    agent,
    data.requestId,
    BasicCRUDActions.Read
  );
  const populatedRequest = await populateRequestAssignedPermissionGroups(context, request);
  return {request: collaborationRequestForWorkspaceExtractor(populatedRequest)};
};

export default getWorkspaceCollaborationRequest;
