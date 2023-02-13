import {IProgramAccessToken} from '../../../definitions/programAccessToken';
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
import {getPublicProgramToken} from '../utils';
import {GetWorkspaceProgramAccessTokenEndpoint} from './types';
import {getWorkspaceProgramAccessTokenJoiSchema} from './validation';

const getWorkspaceProgramAccessTokens: GetWorkspaceProgramAccessTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, getWorkspaceProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  const permissionsSummaryReport = await summarizeAgentPermissionItems({
    context,
    agent,
    workspace,
    type: AppResourceType.ProgramAccessToken,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
    action: BasicCRUDActions.Read,
  });
  let tokens: Array<IProgramAccessToken> = [];
  if (permissionsSummaryReport.hasFullOrLimitedAccess) {
    tokens = await context.data.programAccessToken.getManyByQuery(
      EndpointReusableQueries.getByWorkspaceIdAndExcludeResourceIdList(
        workspaceId,
        permissionsSummaryReport.deniedResourceIdList
      ),
      data
    );
  } else if (permissionsSummaryReport.allowedResourceIdList) {
    tokens = await context.data.programAccessToken.getManyByQuery(
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
    AppResourceType.ProgramAccessToken
  );
  return {
    page: getEndpointPageFromInput(data),
    tokens: tokens.map(token => getPublicProgramToken(context, token)),
  };
};

export default getWorkspaceProgramAccessTokens;
