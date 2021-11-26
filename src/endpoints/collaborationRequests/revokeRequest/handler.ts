import {CollaborationRequestStatusType} from '../../../definitions/collaborationRequest';
import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {checkAuthorizationForCollaborationRequest} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import CollaborationRequestQueries from '../queries';
import {collabRequestExtractor} from '../utils';
import {RevokeRequestEndpoint} from './types';
import {revokeRequestJoiSchema} from './validation';

const revokeRequest: RevokeRequestEndpoint = async (context, instData) => {
  const data = validate(instData.data, revokeRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  let request = await context.data.collaborationRequest.assertGetItem(
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
    BasicCRUDActions.Update
  );

  const status = request.statusHistory[request.statusHistory.length - 1];
  const isRevoked = status.status === CollaborationRequestStatusType.Revoked;

  if (!isRevoked) {
    request = await context.data.collaborationRequest.assertUpdateItem(
      CollaborationRequestQueries.getById(data.requestId),
      {
        statusHistory: request.statusHistory.concat({
          date: getDateString(),
          status: CollaborationRequestStatusType.Revoked,
        }),
      }
    );
  }

  return {
    request: collabRequestExtractor(request),
  };
};

export default revokeRequest;
