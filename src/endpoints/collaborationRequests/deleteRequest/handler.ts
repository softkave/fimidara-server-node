import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import CollaborationRequestQueries from '../queries';
import {checkCollaborationRequestAuthorization02} from '../utils';
import {DeleteRequestEndpoint} from './types';
import {deleteRequestJoiSchema} from './validation';

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
};

export default deleteRequest;
