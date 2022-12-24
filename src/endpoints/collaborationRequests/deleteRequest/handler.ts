import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {waitOnPromises} from '../../../utils/waitOnPromises';
import PermissionItemQueries from '../../permissionItems/queries';
import EndpointReusableQueries from '../../queries';
import {checkCollaborationRequestAuthorization02} from '../utils';
import {DeleteCollaborationRequestEndpoint} from './types';
import {deleteCollaborationRequestJoiSchema} from './validation';

const deleteCollaborationRequest: DeleteCollaborationRequestEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteCollaborationRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {request} = await checkCollaborationRequestAuthorization02(
    context,
    agent,
    data.requestId,
    BasicCRUDActions.Delete
  );

  await context.data.collaborationRequest.deleteItem(EndpointReusableQueries.getById(request.resourceId));
  await waitOnPromises([
    // Delete permission items that explicitly give access to this resource
    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByResource(request.workspaceId, request.resourceId, AppResourceType.CollaborationRequest)
    ),
    context.data.collaborationRequest.deleteItem(EndpointReusableQueries.getById(request.resourceId)),
  ]);
};

export default deleteCollaborationRequest;
