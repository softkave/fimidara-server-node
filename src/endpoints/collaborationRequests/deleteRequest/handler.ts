import {AppActionType, AppResourceType} from '../../../definitions/system';
import {noopAsync} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {enqueueDeleteResourceJob} from '../../jobs/runner';
import {DeleteResourceCascadeFnsMap} from '../../types';
import {checkCollaborationRequestAuthorization02} from '../utils';
import {DeleteCollaborationRequestEndpoint} from './types';
import {deleteCollaborationRequestJoiSchema} from './validation';

export const DELETE_COLLABORATION_REQUEST_CASCADE_FNS: DeleteResourceCascadeFnsMap = {
  [AppResourceType.All]: noopAsync,
  [AppResourceType.System]: noopAsync,
  [AppResourceType.Public]: noopAsync,
  [AppResourceType.Workspace]: noopAsync,
  [AppResourceType.PermissionGroup]: noopAsync,
  [AppResourceType.Folder]: noopAsync,
  [AppResourceType.File]: noopAsync,
  [AppResourceType.User]: noopAsync,
  [AppResourceType.UsageRecord]: noopAsync,
  [AppResourceType.EndpointRequest]: noopAsync,
  [AppResourceType.Job]: noopAsync,
  [AppResourceType.Tag]: noopAsync,
  [AppResourceType.AgentToken]: noopAsync,
  [AppResourceType.PermissionItem]: noopAsync,
  [AppResourceType.FilePresignedPath]: noopAsync,
  [AppResourceType.CollaborationRequest]: (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.collaborationRequest.deleteOneById(args.resourceId, opts)
    ),
  [AppResourceType.AssignedItem]: async (context, args, helpers) =>
    helpers.withTxn(opts =>
      context.semantic.assignedItem.deleteWorkspaceResourceAssignedItems(
        args.workspaceId,
        args.resourceId,
        undefined,
        opts
      )
    ),
};

const deleteCollaborationRequest: DeleteCollaborationRequestEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deleteCollaborationRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {request} = await checkCollaborationRequestAuthorization02(
    context,
    agent,
    data.requestId,
    AppActionType.Delete
  );
  const job = await enqueueDeleteResourceJob(context, {
    type: AppResourceType.CollaborationRequest,
    args: {
      workspaceId: request.workspaceId,
      resourceId: request.resourceId,
    },
  });
  return {jobId: job.resourceId};
};

export default deleteCollaborationRequest;
