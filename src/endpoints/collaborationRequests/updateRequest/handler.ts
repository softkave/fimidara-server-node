import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utils/dateFns';
import {isObjectEmpty} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {addAssignedPermissionGroupList} from '../../assignedItems/addAssignedItems';
import EndpointReusableQueries from '../../queries';
import {
  checkCollaborationRequestAuthorization02,
  collaborationRequestExtractor,
  populateRequestPermissionGroups,
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
    request = await context.data.collaborationRequest.assertGetAndUpdateOneByQuery(
      EndpointReusableQueries.getByResourceId(data.requestId),
      {
        message: data.request.message || request.message,
        expiresAt: data.request.expires,
        lastUpdatedAt: getDateString(),
        lastUpdatedBy: {
          agentId: agent.agentId,
          agentType: agent.agentType,
        },
      }
    );

    if (data.request.permissionGroupsOnAccept) {
      await addAssignedPermissionGroupList(
        context,
        agent,
        workspace,
        data.request.permissionGroupsOnAccept,
        request.resourceId,
        AppResourceType.CollaborationRequest,
        /** deleteExisting */ true
      );
    }
  }

  request = await populateRequestPermissionGroups(context, request);
  return {
    request: collaborationRequestExtractor(request),
  };
};

export default updateCollaborationRequest;
