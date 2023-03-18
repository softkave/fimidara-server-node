import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {reuseableErrors} from '../../../utils/reusableErrors';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {waitOnPromises} from '../../../utils/waitOnPromises';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import EndpointReusableQueries from '../../queries';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {default as PermissionItemQueries} from '../queries';
import {DeletePermissionItemsByEntityEndpoint} from './types';
import {deletePermissionItemsByEntityJoiSchema} from './validation';

const deletePermissionItemsByEntity: DeletePermissionItemsByEntityEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deletePermissionItemsByEntityJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspaceId,
    action: BasicCRUDActions.Delete,
    targets: [{type: AppResourceType.PermissionItem}],
  });

  throw reuseableErrors.common.notImplemented();

  await waitOnPromises([
    // Delete permission items that explicitly give access
    // to the resources to be deleted
    ...data.itemIds.map(id => {
      return context.semantic.permissionItem.deleteManyByQuery(
        PermissionItemQueries.getByResource(
          workspace.resourceId,
          id,
          AppResourceType.PermissionItem
        )
      );
    }),

    context.semantic.permissionItem.deleteManyByQuery(
      EndpointReusableQueries.getByWorkspaceIdAndResourceIdList(workspace.resourceId, data.itemIds)
    ),
  ]);
};

export default deletePermissionItemsByEntity;
