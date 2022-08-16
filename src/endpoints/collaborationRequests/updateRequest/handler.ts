import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {isObjectEmpty} from '../../../utilities/fns';
import {validate} from '../../../utilities/validate';
import {addAssignedPermissionGroupList} from '../../assignedItems/addAssignedItems';
import EndpointReusableQueries from '../../queries';
import {
  checkCollaborationRequestAuthorization02,
  collabRequestExtractor,
} from '../utils';
import {UpdateRequestEndpoint} from './types';
import {updateRequestJoiSchema} from './validation';

const updateRequest: UpdateRequestEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  let {request, workspace} = await checkCollaborationRequestAuthorization02(
    context,
    agent,
    data.requestId,
    BasicCRUDActions.Update
  );

  if (!isObjectEmpty(data.request)) {
    request = await context.data.collaborationRequest.assertUpdateItem(
      EndpointReusableQueries.getById(data.requestId),
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

  const publicData = collabRequestExtractor(request);
  return {
    request: publicData,
  };
};

export default updateRequest;
