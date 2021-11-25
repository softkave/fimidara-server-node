import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {checkAuthorizatonForCollaborationRequest} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import CollaborationRequestQueries from '../queries';
import {collabRequestListExtractor} from '../utils';
import {GetOrganizationRequestsEndpoint} from './types';
import {getOrganizationRequestsJoiSchema} from './validation';

const getOrganizationRequests: GetOrganizationRequestsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getOrganizationRequestsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExists(
    context,
    data.organizationId
  );

  const requests = await context.data.collaborationRequest.getManyItems(
    CollaborationRequestQueries.getByOrganizationId(data.organizationId)
  );

  // TODO: can we do this together, so that we don't waste compute
  const permittedReads = await Promise.all(
    requests.map(item =>
      checkAuthorizatonForCollaborationRequest(
        context,
        agent,
        organization.organizationId,
        item,
        BasicCRUDActions.Read
      )
    )
  );

  const allowedRequests = requests.filter((item, i) => !!permittedReads[i]);

  return {
    requests: collabRequestListExtractor(allowedRequests),
  };
};

export default getOrganizationRequests;
