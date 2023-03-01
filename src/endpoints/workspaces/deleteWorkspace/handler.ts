import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {noopAsync} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {DeleteResourceCascadeFnsMap} from '../../types';
import {executeCascadeDelete} from '../../utils';
import {checkWorkspaceAuthorization02} from '../utils';
import {DeleteWorkspaceEndpoint} from './types';
import {deleteWorkspaceJoiSchema} from './validation';

const cascade: DeleteResourceCascadeFnsMap = {
  [AppResourceType.All]: noopAsync,
  [AppResourceType.System]: noopAsync,
  [AppResourceType.Public]: noopAsync,
  [AppResourceType.Workspace]: (context, workspaceId) =>
    context.semantic.workspace.deleteManyByWorkspaceId(workspaceId),
  [AppResourceType.CollaborationRequest]: (context, workspaceId) =>
    context.semantic.collaborationRequest.deleteManyByWorkspaceId(workspaceId),
  [AppResourceType.ProgramAccessToken]: (context, workspaceId) =>
    context.semantic.programAccessToken.deleteManyByWorkspaceId(workspaceId),
  [AppResourceType.ClientAssignedToken]: (context, workspaceId) =>
    context.semantic.clientAssignedToken.deleteManyByWorkspaceId(workspaceId),
  [AppResourceType.UserToken]: noopAsync,
  [AppResourceType.PermissionGroup]: (context, workspaceId) =>
    context.semantic.permissionGroup.deleteManyByWorkspaceId(workspaceId),
  [AppResourceType.PermissionItem]: (context, workspaceId) =>
    context.semantic.permissionItem.deleteManyByWorkspaceId(workspaceId),
  [AppResourceType.Folder]: (context, workspaceId) =>
    context.semantic.folder.deleteManyByWorkspaceId(workspaceId),
  [AppResourceType.File]: async (context, workspaceId) => {
    // TODO: use folders in S3 and delete just the workspace root folder to
    // delete everything in it?
    throw new Error('Delete files in AWS S3');
    context.semantic.file.deleteManyByWorkspaceId(workspaceId);
  },
  [AppResourceType.User]: noopAsync,
  [AppResourceType.Tag]: (context, workspaceId) =>
    context.semantic.tag.deleteManyByWorkspaceId(workspaceId),
  [AppResourceType.AssignedItem]: (context, workspaceId) =>
    context.semantic.assignedItem.deleteManyByWorkspaceId(workspaceId),
  [AppResourceType.UsageRecord]: (context, workspaceId) =>
    context.semantic.usageRecord.deleteManyByWorkspaceId(workspaceId),
  [AppResourceType.EndpointRequest]: noopAsync,
};

export const deleteWorkspace: DeleteWorkspaceEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteWorkspaceJoiSchema);
  const agent = await context.session.getAgent(context, instData, AppResourceType.User);
  const {workspace} = await checkWorkspaceAuthorization02(
    context,
    agent,
    BasicCRUDActions.Delete,
    data.workspaceId
  );

  await executeCascadeDelete(context, workspace.resourceId, cascade);
};
