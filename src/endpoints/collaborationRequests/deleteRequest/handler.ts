import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import PermissionItemQueries from '../../permissionItems/queries';
import CollaborationRequestQueries from '../queries';
import {checkCollaborationRequestAuthorization02} from '../utils';
import {DeleteRequestEndpoint} from './types';
import {deleteRequestJoiSchema} from './validation';

/**
 * deleteRequest. Ensure that:
 * - Check auth
 * - Delete request and related artifacts
 */

const deleteRequest: DeleteRequestEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {request} = await checkCollaborationRequestAuthorization02(
    context,
    agent,
    data.requestId,
    BasicCRUDActions.Delete
  );

  await context.data.collaborationRequest.deleteItem(
    CollaborationRequestQueries.getById(request.requestId)
  );

  await waitOnPromises([
    // Delete permission items that explicitly give access to this resource
    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByResource(
        request.requestId,
        AppResourceType.CollaborationRequest
      )
    ),

    context.data.collaborationRequest.deleteItem(
      CollaborationRequestQueries.getById(request.requestId)
    ),
  ]);
};

export default deleteRequest;
