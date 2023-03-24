import {AppActionType, AppResourceType, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {extractResourceIdList, noopAsync} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {DELETE_FILE_CASCADE_FNS} from '../../files/deleteFile/handler';
import {enqueueDeleteResourceJob} from '../../jobs/runner';
import {DeleteResourceCascadeFnsMap} from '../../types';
import {executeCascadeDelete} from '../../utils';
import FolderQueries from '../queries';
import {checkFolderAuthorization02} from '../utils';
import {DeleteFolderEndpoint} from './types';
import {deleteFolderJoiSchema} from './validation';

export const DELETE_FOLDER_CASCADE_FNS: DeleteResourceCascadeFnsMap = {
  [AppResourceType.All]: noopAsync,
  [AppResourceType.System]: noopAsync,
  [AppResourceType.Public]: noopAsync,
  [AppResourceType.Workspace]: noopAsync,
  [AppResourceType.CollaborationRequest]: noopAsync,
  [AppResourceType.AgentToken]: noopAsync,
  [AppResourceType.PermissionGroup]: noopAsync,
  [AppResourceType.User]: noopAsync,
  [AppResourceType.UsageRecord]: noopAsync,
  [AppResourceType.EndpointRequest]: noopAsync,
  [AppResourceType.Job]: noopAsync,
  [AppResourceType.Tag]: noopAsync,
  [AppResourceType.File]: async (context, args, opts) => {
    const files = await context.semantic.file.getManyByLiteralDataQuery(
      FolderQueries.getByAncestor(args.workspaceId, args.resourceId)
    );
    await Promise.all([
      context.semantic.file.deleteManyByQuery(
        FolderQueries.getByAncestor(args.workspaceId, args.resourceId),
        opts
      ),
      executeCascadeDelete(context, DELETE_FILE_CASCADE_FNS, {
        workspaceId: args.workspaceId,
        fileIdList: extractResourceIdList(files),
      }),
    ]);
  },
  [AppResourceType.Folder]: async (context, args, opts) => {
    await context.semantic.folder.deleteManyByQuery(
      FolderQueries.getByAncestor(args.workspaceId, args.resourceId),
      opts
    );
  },
  [AppResourceType.PermissionItem]: (context, args, opts) =>
    context.semantic.permissionItem.deleteManyByTargetId(args.resourceId, opts),
  [AppResourceType.AssignedItem]: (context, args, opts) =>
    context.semantic.assignedItem.deleteResourceAssignedItems(
      args.workspaceId,
      args.resourceId,
      undefined,
      opts
    ),
};

const deleteFolder: DeleteFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  const {folder} = await checkFolderAuthorization02(context, agent, data, AppActionType.Delete);
  const job = await enqueueDeleteResourceJob(context, {
    type: AppResourceType.Folder,
    args: {
      workspaceId: folder.workspaceId,
      resourceId: folder.resourceId,
    },
  });
  return {jobId: job.resourceId};
};

export default deleteFolder;
