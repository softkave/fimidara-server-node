import {AppActionType, AppResourceType, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {noopAsync} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {enqueueDeleteResourceJob} from '../../jobs/runner';
import {DeleteResourceCascadeFnsMap} from '../../types';
import {checkFileAuthorization02} from '../utils';
import {DeleteFileCascadeDeleteFnsArgs, DeleteFileEndpoint} from './types';
import {deleteFileJoiSchema} from './validation';

export const DELETE_FILE_CASCADE_FNS: DeleteResourceCascadeFnsMap<DeleteFileCascadeDeleteFnsArgs> =
  {
    [AppResourceType.All]: noopAsync,
    [AppResourceType.System]: noopAsync,
    [AppResourceType.Public]: noopAsync,
    [AppResourceType.Workspace]: noopAsync,
    [AppResourceType.CollaborationRequest]: noopAsync,
    [AppResourceType.AgentToken]: noopAsync,
    [AppResourceType.PermissionGroup]: noopAsync,
    [AppResourceType.Folder]: noopAsync,
    [AppResourceType.User]: noopAsync,
    [AppResourceType.UsageRecord]: noopAsync,
    [AppResourceType.EndpointRequest]: noopAsync,
    [AppResourceType.Job]: noopAsync,
    [AppResourceType.Tag]: noopAsync,
    [AppResourceType.File]: async (context, args, opts) => {
      await Promise.all([
        context.semantic.file.deleteManyByIdList(args.fileIdList, opts),
        context.fileBackend.deleteFiles({
          bucket: context.appVariables.S3Bucket,
          keys: args.fileIdList,
        }),
      ]);
    },
    [AppResourceType.PermissionItem]: (context, args, opts) =>
      context.semantic.permissionItem.deleteManyByTargetId(args.fileIdList, opts),
    [AppResourceType.AssignedItem]: (context, args, opts) =>
      context.semantic.assignedItem.deleteWorkspaceResourceAssignedItems(
        args.workspaceId,
        args.fileIdList,
        undefined,
        opts
      ),
    [AppResourceType.FilePresignedPath]: (context, args, opts) =>
      context.semantic.filePresignedPath.deleteManyByQuery({fileId: {$in: args.fileIdList}}, opts),
  };

const deleteFile: DeleteFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteFileJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  const {file} = await checkFileAuthorization02(context, agent, data, AppActionType.Delete);
  const job = await enqueueDeleteResourceJob(context, {
    type: AppResourceType.File,
    args: {workspaceId: file.workspaceId, fileIdList: [file.resourceId]},
  });
  return {jobId: job.resourceId};
};

export default deleteFile;
