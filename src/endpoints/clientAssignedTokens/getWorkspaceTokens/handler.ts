import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {populateResourceListWithAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {
  makeWorkspacePermissionContainerList,
  summarizeAgentPermissionItems,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {getWorkspaceId} from '../../contexts/SessionContext';
import EndpointReusableQueries from '../../queries';
import {PermissionDeniedError} from '../../user/errors';
import {getEndpointPageFromInput} from '../../utils';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {getPublicClientToken} from '../utils';
import {GetWorkspaceClientAssignedTokenEndpoint} from './types';
import {getWorkspaceClientAssignedTokenJoiSchema} from './validation';

const getWorkspaceClientAssignedTokens: GetWorkspaceClientAssignedTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, getWorkspaceClientAssignedTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  const permissionsSummaryReport = await summarizeAgentPermissionItems({
    context,
    agent,
    workspace,
    type: AppResourceType.ClientAssignedToken,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
    action: BasicCRUDActions.Read,
  });
  let tokens: Array<IClientAssignedToken> = [];
  if (permissionsSummaryReport.hasFullOrLimitedAccess) {
    tokens = await context.data.clientAssignedToken.getManyByQuery(
      EndpointReusableQueries.getByWorkspaceIdAndExcludeResourceIdList(
        workspaceId,
        permissionsSummaryReport.deniedResourceIdList
      ),
      data
    );
  } else if (permissionsSummaryReport.allowedResourceIdList) {
    tokens = await context.data.clientAssignedToken.getManyByQuery(
      EndpointReusableQueries.getByWorkspaceIdAndResourceIdList(
        workspaceId,
        permissionsSummaryReport.allowedResourceIdList
      ),
      data
    );
  } else if (permissionsSummaryReport.noAccess) {
    throw new PermissionDeniedError();
  }

  tokens = await populateResourceListWithAssignedPermissionGroupsAndTags(
    context,
    workspace.resourceId,
    tokens,
    AppResourceType.ClientAssignedToken
  );
  return {
    page: getEndpointPageFromInput(data),
    tokens: tokens.map(token => getPublicClientToken(context, token)),
  };
};

export default getWorkspaceClientAssignedTokens;
