import {AppActionType, AppResourceType} from '../../../definitions/system';
import {extractResourceIdList, noopAsync} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {DELETE_FILE_CASCADE_FNS} from '../../files/deleteFile/handler';
import {enqueueDeleteResourceJob} from '../../jobs/runner';
import EndpointReusableQueries from '../../queries';
import {DeleteResourceCascadeFnsMap} from '../../types';
import {executeCascadeDelete} from '../../utils';
import {checkWorkspaceAuthorization02} from '../utils';
import {DeleteWorkspaceEndpoint} from './types';
import {deleteWorkspaceJoiSchema} from './validation';

export const DELETE_WORKSPACE_CASCADE_FNS: DeleteResourceCascadeFnsMap = {
  [AppResourceType.All]: noopAsync,
  [AppResourceType.System]: noopAsync,
  [AppResourceType.Public]: noopAsync,
  [AppResourceType.User]: noopAsync,
  [AppResourceType.EndpointRequest]: noopAsync,
  [AppResourceType.Job]: (context, args) =>
    context.data.job.deleteManyByQuery({workspaceId: args.workspaceId}),
  [AppResourceType.Workspace]: (context, args, opts) =>
    context.semantic.workspace.deleteManyByWorkspaceId(args.workspaceId, opts),
  [AppResourceType.CollaborationRequest]: (context, args, opts) =>
    context.semantic.collaborationRequest.deleteManyByWorkspaceId(args.workspaceId, opts),
  [AppResourceType.AgentToken]: (context, args, opts) =>
    context.semantic.agentToken.deleteManyByWorkspaceId(args.workspaceId, opts),
  [AppResourceType.PermissionGroup]: (context, args, opts) =>
    context.semantic.permissionGroup.deleteManyByWorkspaceId(args.workspaceId, opts),
  [AppResourceType.PermissionItem]: (context, args, opts) =>
    context.semantic.permissionItem.deleteManyByWorkspaceId(args.workspaceId, opts),
  [AppResourceType.Folder]: (context, args, opts) =>
    context.semantic.folder.deleteManyByWorkspaceId(args.workspaceId, opts),
  [AppResourceType.File]: async (context, args, opts) => {
    const files = await context.semantic.file.getManyByQuery(
      EndpointReusableQueries.getByWorkspaceId(args.workspaceId)
    );
    await Promise.all([
      context.semantic.file.deleteManyByQuery(
        EndpointReusableQueries.getByWorkspaceId(args.workspaceId),
        opts
      ),
      executeCascadeDelete(context, DELETE_FILE_CASCADE_FNS, {
        workspaceId: args.workspaceId,
        fileIdList: extractResourceIdList(files),
      }),
    ]);
  },
  [AppResourceType.Tag]: (context, args, opts) =>
    context.semantic.tag.deleteManyByWorkspaceId(args.workspaceId, opts),
  [AppResourceType.AssignedItem]: (context, args, opts) =>
    context.semantic.assignedItem.deleteManyByWorkspaceId(args.workspaceId, opts),
  [AppResourceType.UsageRecord]: (context, args, opts) =>
    context.semantic.usageRecord.deleteManyByWorkspaceId(args.workspaceId, opts),
};

const deleteWorkspace: DeleteWorkspaceEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteWorkspaceJoiSchema);
  const agent = await context.session.getAgent(context, instData, AppResourceType.User);
  const {workspace} = await checkWorkspaceAuthorization02(
    context,
    agent,
    AppActionType.Delete,
    data.workspaceId
  );
  const job = await enqueueDeleteResourceJob(context, {
    type: AppResourceType.Workspace,
    args: {
      workspaceId: workspace.resourceId,
      resourceId: workspace.resourceId,
    },
  });
  return {jobId: job.resourceId};
};

export default deleteWorkspace;
