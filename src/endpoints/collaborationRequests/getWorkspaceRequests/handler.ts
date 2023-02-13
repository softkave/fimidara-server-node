import {ICollaborationRequest} from '../../../definitions/collaborationRequest';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {
  makeWorkspacePermissionContainerList,
  summarizeAgentPermissionItems,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {getWorkspaceId} from '../../contexts/SessionContext';
import EndpointReusableQueries from '../../queries';
import {PermissionDeniedError} from '../../user/errors';
import {getEndpointPageFromInput} from '../../utils';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {collaborationRequestListExtractor, populateRequestListPermissionGroups} from '../utils';
import {GetWorkspaceCollaborationRequestsEndpoint} from './types';
import {getWorkspaceCollaborationRequestsJoiSchema} from './validation';

const getWorkspaceCollaborationRequests: GetWorkspaceCollaborationRequestsEndpoint = async (context, instData) => {
  const data = validate(instData.data, getWorkspaceCollaborationRequestsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  const permissionsSummaryReport = await summarizeAgentPermissionItems({
    context,
    agent,
    workspace,
    type: AppResourceType.CollaborationRequest,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
    action: BasicCRUDActions.Read,
  });
  let requests: Array<ICollaborationRequest> = [];
  if (permissionsSummaryReport.hasFullOrLimitedAccess) {
    requests = await context.data.collaborationRequest.getManyByQuery(
      EndpointReusableQueries.getByWorkspaceIdAndExcludeResourceIdList(
        workspaceId,
        permissionsSummaryReport.deniedResourceIdList
      ),
      data
    );
  } else if (permissionsSummaryReport.allowedResourceIdList) {
    requests = await context.data.collaborationRequest.getManyByQuery(
      EndpointReusableQueries.getByWorkspaceIdAndResourceIdList(
        workspaceId,
        permissionsSummaryReport.allowedResourceIdList
      ),
      data
    );
  } else if (permissionsSummaryReport.noAccess) {
    throw new PermissionDeniedError();
  }

  requests = await populateRequestListPermissionGroups(context, requests);
  return {page: getEndpointPageFromInput(data), requests: collaborationRequestListExtractor(requests)};
};

export default getWorkspaceCollaborationRequests;
