import {IPermissionGroup} from '../../../definitions/permissionGroups';
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
import {permissionGroupListExtractor} from '../utils';
import {GetWorkspacePermissionGroupsEndpoint} from './types';
import {getWorkspacePermissionGroupsJoiSchema} from './validation';

const getWorkspacePermissionGroups: GetWorkspacePermissionGroupsEndpoint = async (context, instData) => {
  const data = validate(instData.data, getWorkspacePermissionGroupsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  const permissionsSummaryReport = await summarizeAgentPermissionItems({
    context,
    agent,
    workspace,
    type: AppResourceType.PermissionGroup,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
    action: BasicCRUDActions.Read,
  });
  let items: Array<IPermissionGroup> = [];
  if (permissionsSummaryReport.hasFullOrLimitedAccess) {
    items = await context.data.permissiongroup.getManyByQuery(
      EndpointReusableQueries.getByWorkspaceIdAndExcludeResourceIdList(
        workspaceId,
        permissionsSummaryReport.deniedResourceIdList
      ),
      data
    );
  } else if (permissionsSummaryReport.allowedResourceIdList) {
    items = await context.data.permissiongroup.getManyByQuery(
      EndpointReusableQueries.getByWorkspaceIdAndResourceIdList(
        workspaceId,
        permissionsSummaryReport.allowedResourceIdList
      ),
      data
    );
  } else if (permissionsSummaryReport.noAccess) {
    throw new PermissionDeniedError();
  }

  items = await populateResourceListWithAssignedPermissionGroupsAndTags(
    context,
    workspace.resourceId,
    items,
    AppResourceType.PermissionGroup
  );
  return {page: getEndpointPageFromInput(data), permissionGroups: permissionGroupListExtractor(items)};
};

export default getWorkspacePermissionGroups;
