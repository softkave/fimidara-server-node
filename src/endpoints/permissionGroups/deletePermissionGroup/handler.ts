import {AppActionType, AppResourceType} from '../../../definitions/system';
import {noopAsync} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {InvalidRequestError} from '../../errors';
import {enqueueDeleteResourceJob} from '../../jobs/runner';
import {DeleteResourceCascadeFnsMap} from '../../types';
import {checkPermissionGroupAuthorization03} from '../utils';
import {DeletePermissionGroupEndpoint} from './types';
import {deletePermissionGroupJoiSchema} from './validation';

export const DELETE_PERMISSION_GROUP_CASCADE_FNS: DeleteResourceCascadeFnsMap = {
  [AppResourceType.All]: noopAsync,
  [AppResourceType.System]: noopAsync,
  [AppResourceType.Public]: noopAsync,
  [AppResourceType.Workspace]: noopAsync,
  [AppResourceType.CollaborationRequest]: noopAsync,
  [AppResourceType.AgentToken]: noopAsync,
  [AppResourceType.Folder]: noopAsync,
  [AppResourceType.File]: noopAsync,
  [AppResourceType.User]: noopAsync,
  [AppResourceType.UsageRecord]: noopAsync,
  [AppResourceType.EndpointRequest]: noopAsync,
  [AppResourceType.Job]: noopAsync,
  [AppResourceType.Tag]: noopAsync,
  [AppResourceType.FilePresignedPath]: noopAsync,
  [AppResourceType.PermissionGroup]: (context, args, helpers) =>
    helpers.withTxn(opts => context.semantic.permissionGroup.deleteOneById(args.resourceId, opts)),
  [AppResourceType.PermissionItem]: async (context, args, helpers) =>
    helpers.withTxn(opts =>
      Promise.all([
        context.semantic.permissionItem.deleteManyByTargetId(args.resourceId, opts),
        context.semantic.permissionItem.deleteManyByEntityId(args.resourceId, opts),
      ])
    ),
  [AppResourceType.AssignedItem]: async (context, args, helpers) =>
    helpers.withTxn(opts =>
      Promise.all([
        context.semantic.assignedItem.deleteWorkspaceAssignedItemResources(
          args.workspaceId,
          args.resourceId,
          opts
        ),
        context.semantic.assignedItem.deleteWorkspaceResourceAssignedItems(
          args.workspaceId,
          args.resourceId,
          undefined,
          opts
        ),
      ])
    ),
};

const deletePermissionGroup: DeletePermissionGroupEndpoint = async (context, instData) => {
  const data = validate(instData.data, deletePermissionGroupJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {permissionGroup, workspace} = await checkPermissionGroupAuthorization03(
    context,
    agent,
    data,
    AppActionType.Delete
  );

  if (permissionGroup.resourceId === workspace.publicPermissionGroupId) {
    throw new InvalidRequestError("Cannot delete the workspace's public public permission group.");
  }

  const job = await enqueueDeleteResourceJob(context, {
    type: AppResourceType.PermissionGroup,
    args: {
      workspaceId: workspace.resourceId,
      resourceId: permissionGroup.resourceId,
    },
  });
  return {jobId: job.resourceId};
};

export default deletePermissionGroup;
