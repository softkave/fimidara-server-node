import {AppActionType, AppResourceType} from '../../../definitions/system';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {DeletePermissionItemsByIdEndpoint} from './types';
import {deletePermissionItemsByIdJoiSchema} from './validation';

const deletePermissionItemsById: DeletePermissionItemsByIdEndpoint = async (context, instData) => {
  const data = validate(instData.data, deletePermissionItemsByIdJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspaceId: workspace.resourceId,
    action: AppActionType.Delete,
    targets: {targetType: AppResourceType.PermissionItem},
  });
  await executeWithMutationRunOptions(context, opts =>
    context.semantic.permissionItem.deleteManyByIdList(data.itemIds, opts)
  );
};

export default deletePermissionItemsById;
