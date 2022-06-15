import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {resourceListWithAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {PermissionDeniedError} from '../../user/errors';
import {checkWorkspaceExists} from '../../workspaces/utils';
import PermissionGroupQueries from '../queries';
import {permissionGroupListExtractor} from '../utils';
import {GetWorkspacePermissionGroupsEndpoint} from './types';
import {getWorkspacePermissionGroupsJoiSchema} from './validation';

const getWorkspacePermissionGroups: GetWorkspacePermissionGroupsEndpoint =
  async (context, instData) => {
    const data = validate(instData.data, getWorkspacePermissionGroupsJoiSchema);

    const agent = await context.session.getAgent(context, instData);
    const workspaceId = getWorkspaceId(agent, data.workspaceId);
    const workspace = await checkWorkspaceExists(context, workspaceId);
    const items = await context.data.permissiongroup.getManyItems(
      PermissionGroupQueries.getByWorkspaceId(workspaceId)
    );

    // TODO: can we do this together, so that we don't waste compute
    const permittedReads = await Promise.all(
      items.map(item =>
        checkAuthorization({
          context,
          agent,
          workspace,
          resource: item,
          type: AppResourceType.PermissionGroup,
          permissionOwners: makeWorkspacePermissionOwnerList(
            workspace.resourceId
          ),
          action: BasicCRUDActions.Read,
          nothrow: true,
        })
      )
    );

    let allowedItems = items.filter((item, i) => !!permittedReads[i]);

    if (allowedItems.length === 0 && items.length > 0) {
      throw new PermissionDeniedError();
    }

    allowedItems = await resourceListWithAssignedPermissionGroupsAndTags(
      context,
      workspace.resourceId,
      allowedItems,
      AppResourceType.PermissionGroup
    );

    return {
      permissionGroups: permissionGroupListExtractor(allowedItems),
    };
  };

export default getWorkspacePermissionGroups;
