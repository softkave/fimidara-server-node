import {
  AppResourceType,
  BasicCRUDActions,
  SessionAgentType,
} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {waitOnPromises} from '../../../utils/waitOnPromises';
import {deleteAssignableItemAssignedItems} from '../../assignedItems/deleteAssignedItems';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {IBaseContext} from '../../contexts/types';
import FileQueries from '../../files/queries';
import {internalDeleteFolderList} from '../../folders/deleteFolder/handler';
import FolderQueries from '../../folders/queries';
import ProgramAccessTokenQueries from '../../programAccessTokens/queries';
import EndpointReusableQueries from '../../queries';
import {checkWorkspaceAuthorization02} from '../utils';
import {DeleteWorkspaceEndpoint} from './types';
import {deleteWorkspaceJoiSchema} from './validation';

const deleteWorkspace: DeleteWorkspaceEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteWorkspaceJoiSchema);
  const agent = await context.session.getAgent(context, instData, [
    SessionAgentType.User,
  ]);

  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const {workspace} = await checkWorkspaceAuthorization02(
    context,
    agent,
    workspaceId,
    BasicCRUDActions.Delete
  );

  await waitOnPromises([
    // Collaboration requests
    context.data.collaborationRequest.deleteManyItems(
      EndpointReusableQueries.getByWorkspaceId(workspace.resourceId)
    ),

    // Program tokens
    context.data.programAccessToken.deleteManyItems(
      ProgramAccessTokenQueries.getByWorkspaceId(workspace.resourceId)
    ),

    // Client tokens
    context.data.clientAssignedToken.deleteManyItems(
      EndpointReusableQueries.getByWorkspaceId(workspace.resourceId)
    ),

    // PermissionGroups
    context.data.permissiongroup.deleteManyItems(
      EndpointReusableQueries.getByWorkspaceId(workspace.resourceId)
    ),

    // Permission items
    context.data.permissionItem.deleteManyItems(
      EndpointReusableQueries.getByWorkspaceId(workspace.resourceId)
    ),

    // Tags
    context.data.tag.deleteManyItems(
      EndpointReusableQueries.getByWorkspaceId(workspace.resourceId)
    ),

    // Assigned items
    context.data.assignedItem.deleteManyItems(
      EndpointReusableQueries.getByWorkspaceId(workspace.resourceId)
    ),

    // Folders
    // TODO: deleting folders this way may be more expensive, when we can
    // possibly one-shot it since we're deleting the entire workspace
    internalDeleteFoldersByWorkspaceId(context, workspace.resourceId),

    // Files
    internalDeleteFilesByWorkspaceId(context, workspace.resourceId),

    // Remove collaborators
    updateCollaborators(context, workspace.resourceId),

    //  Delete the workspace
    context.cacheProviders.workspace.deleteById(context, workspace.resourceId),
  ]);
};

async function internalDeleteFilesByWorkspaceId(
  context: IBaseContext,
  workspaceId: string
) {
  // TODO: should we get files by name path, paginated
  const files = await context.data.file.getManyItems(
    FileQueries.getRootFiles(workspaceId)
  );

  await context.data.file.deleteManyItems(
    FileQueries.getRootFiles(workspaceId)
  );

  await context.fileBackend.deleteFiles({
    bucket: context.appVariables.S3Bucket,
    keys: files.map(file => file.resourceId),
  });
}

async function internalDeleteFoldersByWorkspaceId(
  context: IBaseContext,
  workspaceId: string
) {
  await internalDeleteFolderList(
    context,
    await context.data.folder.getManyItems(
      // Root folders
      FolderQueries.getRootFolders(workspaceId)
    )
  );
}

async function updateCollaborators(context: IBaseContext, workspaceId: string) {
  await deleteAssignableItemAssignedItems(
    context,
    workspaceId,
    workspaceId,
    AppResourceType.Workspace
  );
}

export default deleteWorkspace;
