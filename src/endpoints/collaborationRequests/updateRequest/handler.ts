import {BasicCRUDActions} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {isObjectEmpty} from '../../../utils/fns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {addAssignedPermissionGroupList} from '../../assignedItems/addAssignedItems';
import {
  checkCollaborationRequestAuthorization02,
  collaborationRequestForWorkspaceExtractor,
  populateRequestAssignedPermissionGroups,
} from '../utils';
import {UpdateCollaborationRequestEndpoint} from './types';
import {updateCollaborationRequestJoiSchema} from './validation';

const updateCollaborationRequest: UpdateCollaborationRequestEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateCollaborationRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  let {request, workspace} = await checkCollaborationRequestAuthorization02(
    context,
    agent,
    data.requestId,
    BasicCRUDActions.Update
  );

  if (!isObjectEmpty(data.request)) {
    request = await context.semantic.collaborationRequest.getAndUpdateOneById(data.requestId, {
      message: data.request.message ?? request.message,
      expiresAt: data.request.expires,
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    });

    if (data.request.permissionGroupsAssignedOnAcceptingRequest) {
      await addAssignedPermissionGroupList(
        context,
        agent,
        workspace.resourceId,
        data.request.permissionGroupsAssignedOnAcceptingRequest,
        request.resourceId,
        /** deleteExisting */ true
      );
    }
  }

  request = await populateRequestAssignedPermissionGroups(context, request);
  return {request: collaborationRequestForWorkspaceExtractor(request)};
};

export default updateCollaborationRequest;
