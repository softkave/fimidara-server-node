import {AppActionType, AppResourceType} from '../../../definitions/system';
import {noopAsync} from '../../../utils/fns';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {enqueueDeleteResourceJob} from '../../jobs/runner';
import {DeleteResourceCascadeFnsMap} from '../../types';
import {checkCollaboratorAuthorization02} from '../utils';
import {RemoveCollaboratorCascadeFnsArgs, RemoveCollaboratorEndpoint} from './types';
import {removeCollaboratorJoiSchema} from './validation';

// TODO: delete client token and client token artifacts using provided resource ID
export const REMOVE_COLLABORATOR_CASCADE_FNS: DeleteResourceCascadeFnsMap<RemoveCollaboratorCascadeFnsArgs> =
  {
    [AppResourceType.All]: noopAsync,
    [AppResourceType.System]: noopAsync,
    [AppResourceType.Public]: noopAsync,
    [AppResourceType.Workspace]: noopAsync,
    [AppResourceType.AgentToken]: noopAsync,
    [AppResourceType.PermissionGroup]: noopAsync,
    [AppResourceType.Folder]: noopAsync,
    [AppResourceType.File]: noopAsync,
    [AppResourceType.User]: noopAsync,
    [AppResourceType.UsageRecord]: noopAsync,
    [AppResourceType.EndpointRequest]: noopAsync,
    [AppResourceType.Job]: noopAsync,
    [AppResourceType.Tag]: noopAsync,
    [AppResourceType.CollaborationRequest]: (context, args, helpers) =>
      helpers.withTxn(opts =>
        context.semantic.collaborationRequest.deleteManyByQuery(
          {workspaceId: args.workspaceId, recipientEmail: args.userEmail},
          opts
        )
      ),
    [AppResourceType.PermissionItem]: async (context, args, helpers) =>
      helpers.withTxn(opts =>
        Promise.all([
          context.semantic.permissionItem.deleteManyByTargetId(args.resourceId, opts),
          context.semantic.permissionItem.deleteManyByEntityId(args.resourceId, opts),
        ])
      ),
    [AppResourceType.AssignedItem]: (context, args, helpers) =>
      helpers.withTxn(opts =>
        context.semantic.assignedItem.deleteWorkspaceResourceAssignedItems(
          args.workspaceId,
          args.resourceId,
          undefined,
          opts
        )
      ),
    [AppResourceType.FilePresignedPath]: (context, args, helpers) =>
      helpers.withTxn(opts =>
        context.semantic.filePresignedPath.deleteManyByQuery(
          {agentTokenId: args.agentTokenId},
          opts
        )
      ),
  };

const removeCollaborator: RemoveCollaboratorEndpoint = async (context, instData) => {
  const data = validate(instData.data, removeCollaboratorJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const {collaborator} = await checkCollaboratorAuthorization02(
    context,
    agent,
    workspaceId,
    data.collaboratorId,
    AppActionType.Delete
  );
  const job = await enqueueDeleteResourceJob(context, {
    type: AppResourceType.User,
    args: {
      workspaceId,
      resourceId: collaborator.resourceId,
      userEmail: collaborator.email,
      agentTokenId: agent.agentTokenId,
    },
    isRemoveCollaborator: true,
  });
  return {jobId: job.resourceId};
};

export default removeCollaborator;
