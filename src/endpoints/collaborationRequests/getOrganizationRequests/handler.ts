import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import EndpointReusableQueries from '../../queries';
import {PermissionDeniedError} from '../../user/errors';
import {collabRequestListExtractor} from '../utils';
import {GetOrganizationRequestsEndpoint} from './types';
import {getOrganizationRequestsJoiSchema} from './validation';

/**
 * getOrganizationRequests.
 * Fetches an organization's collaboration requests after auth check
 * and filters the ones the fetching agent has access to.
 *
 * Ensure that:
 * - Check auth
 * - Fetch and filter permitted requests
 */

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
    EndpointReusableQueries.getByOrganizationId(data.organizationId)
  );

  // TODO: can we do this together, so that we don't waste compute
  const permittedReads = await Promise.all(
    requests.map(item =>
      checkAuthorization({
        context,
        agent,
        organization,
        resource: item,
        type: AppResourceType.CollaborationRequest,
        permissionOwners: makeOrgPermissionOwnerList(organization.resourceId),
        action: BasicCRUDActions.Read,
        nothrow: true,
      })
    )
  );

  const allowedRequests = requests.filter((item, i) => !!permittedReads[i]);

  if (allowedRequests.length === 0 && requests.length > 0) {
    throw new PermissionDeniedError();
  }

  return {
    requests: collabRequestListExtractor(allowedRequests),
  };
};

export default getOrganizationRequests;
