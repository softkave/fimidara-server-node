import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkWorkspaceExists} from '../../workspaces/utils';
import EndpointReusableQueries from '../../queries';
import {PermissionDeniedError} from '../../user/errors';
import {collabRequestListExtractor} from '../utils';
import {GetWorkspaceRequestsEndpoint} from './types';
import {getWorkspaceRequestsJoiSchema} from './validation';

const getWorkspaceRequests: GetWorkspaceRequestsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getWorkspaceRequestsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspace = await checkWorkspaceExists(context, data.workspaceId);

  const requests = await context.data.collaborationRequest.getManyItems(
    EndpointReusableQueries.getByWorkspaceId(data.workspaceId)
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

  const allowedRequests = requests.filter((item, i) => !!permittedReads[i]);

  if (allowedRequests.length === 0 && requests.length > 0) {
    throw new PermissionDeniedError();
  }

  return {
    requests: collabRequestListExtractor(allowedRequests),
  };
};

export default getWorkspaceRequests;
