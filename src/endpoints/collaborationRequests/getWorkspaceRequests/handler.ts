import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {getWorkspaceId} from '../../contexts/SessionContext';
import EndpointReusableQueries from '../../queries';
import {PermissionDeniedError} from '../../user/errors';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {
  collaborationRequestListExtractor,
  populateRequestListPermissionGroups,
} from '../utils';
import {GetWorkspaceRequestsEndpoint} from './types';
import {getWorkspaceRequestsJoiSchema} from './validation';

const getWorkspaceRequests: GetWorkspaceRequestsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getWorkspaceRequestsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  const requests = await context.data.collaborationRequest.getManyItems(
    EndpointReusableQueries.getByWorkspaceId(workspaceId)
  );

  // TODO: can we do this together, so that we don't waste compute
  const permittedReads = await Promise.all(
    requests.map(item =>
      checkAuthorization({
        context,
        agent,
        workspace,
        resource: item,
        type: AppResourceType.CollaborationRequest,
        permissionOwners: makeWorkspacePermissionOwnerList(
          workspace.resourceId
        ),
        action: BasicCRUDActions.Read,
        nothrow: true,
      })
    )
  );

  let allowedRequests = requests.filter((item, i) => !!permittedReads[i]);
  if (allowedRequests.length === 0 && requests.length > 0) {
    throw new PermissionDeniedError();
  }

  allowedRequests = await populateRequestListPermissionGroups(
    context,
    allowedRequests
  );

  return {
    requests: collaborationRequestListExtractor(allowedRequests),
  };
};

export default getWorkspaceRequests;
