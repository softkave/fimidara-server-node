import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {checkAuthorizationForCollaborationRequest} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import CollaborationRequestQueries from '../queries';
import {DeleteRequestEndpoint} from './types';
import {deleteRequestJoiSchema} from './validation';

const deleteRequest: DeleteRequestEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const request = await context.data.collaborationRequest.assertGetItem(
    CollaborationRequestQueries.getById(data.requestId)
  );

  const organization = await checkOrganizationExists(
    context,
    request.organizationId
  );

  await checkAuthorizationForCollaborationRequest(
    context,
    agent,
    organization.organizationId,
    request,
    BasicCRUDActions.Delete
  );

  await context.data.collaborationRequest.deleteItem(
    CollaborationRequestQueries.getById(data.requestId)
  );
};

export default deleteRequest;
