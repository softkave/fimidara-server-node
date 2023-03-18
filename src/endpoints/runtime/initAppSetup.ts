import {merge} from 'lodash';
import {CollaborationRequestStatusType} from '../../definitions/collaborationRequest';
import {IPermissionItem} from '../../definitions/permissionItem';
import {
  AppResourceType,
  APP_RUNTIME_STATE_DOC_ID,
  BasicCRUDActions,
  IAppRuntimeState,
  SYSTEM_SESSION_AGENT,
} from '../../definitions/system';
import {IWorkspace} from '../../definitions/workspace';
import {IAppRuntimeVars} from '../../resources/vars';
import {getTimestamp} from '../../utils/dateFns';
import {newWorkspaceResource} from '../../utils/fns';
import {addAssignedPermissionGroupList} from '../assignedItems/addAssignedItems';
import {MemStore} from '../contexts/mem/Mem';
import {
  ISemanticDataAccessProviderMutationRunOptions,
  ISemanticDataAccessProviderRunOptions,
} from '../contexts/semantic/types';
import {IBaseContext} from '../contexts/types';
import {createFolderList} from '../folders/addFolder/handler';
import {addRootnameToPath} from '../folders/utils';
import EndpointReusableQueries from '../queries';
import internalCreateWorkspace from '../workspaces/addWorkspace/internalCreateWorkspace';
import {assertWorkspace} from '../workspaces/utils';

const filePath = '/files';
const imagesPath = '/files/images';
const appSetupVars = {
  workspaceName: 'Fimidara',
  rootname: 'fimidara',
  workspaceImagesfolderpath: imagesPath + '/workspaces',
  userImagesfolderpath: imagesPath + '/users',
  workspacesImageUploadPermissionGroupName: 'Fimidara-workspaces-image-upload',
  usersImageUploadPermissionGroupName: 'Fimidara-users-image-upload',
};

async function setupWorkspace(
  context: IBaseContext,
  name: string,
  rootname: string,
  opts: ISemanticDataAccessProviderMutationRunOptions
) {
  return await internalCreateWorkspace(
    context,
    {
      name,
      rootname,
      description: "System-generated workspace for Fimidara's own operations",
    },
    SYSTEM_SESSION_AGENT,
    undefined,
    opts
  );
}

async function setupDefaultUserCollaborationRequest(
  context: IBaseContext,
  workspace: IWorkspace,
  userEmail: string,
  adminPermissionGroupId: string,
  opts: ISemanticDataAccessProviderMutationRunOptions
) {
  const request = newWorkspaceResource(
    SYSTEM_SESSION_AGENT,
    AppResourceType.CollaborationRequest,
    workspace.resourceId,
    {
      message:
        'System-generated collaboration request ' +
        "to the system-generated workspace that manages File's " +
        'own operations',
      workspaceName: workspace.name,
      recipientEmail: userEmail,
      status: CollaborationRequestStatusType.Pending,
      statusDate: getTimestamp(),
    }
  );
  await context.semantic.collaborationRequest.insertItem(request, opts);
  await addAssignedPermissionGroupList(
    context,
    SYSTEM_SESSION_AGENT,
    workspace.resourceId,
    [{permissionGroupId: adminPermissionGroupId}],
    request.resourceId,
    /** deleteExisting */ false,
    /** skipPermissionGroupsExistCheck */ true,
    opts
  );
}

async function setupFolders(
  context: IBaseContext,
  workspace: IWorkspace,
  opts: ISemanticDataAccessProviderMutationRunOptions
) {
  const [workspaceImagesFolder, userImagesFolder] = await Promise.all([
    createFolderList(
      context,
      SYSTEM_SESSION_AGENT,
      workspace,
      {folderpath: addRootnameToPath(appSetupVars.workspaceImagesfolderpath, workspace.rootname)},
      opts
    ),
    createFolderList(
      context,
      SYSTEM_SESSION_AGENT,
      workspace,
      {folderpath: addRootnameToPath(appSetupVars.userImagesfolderpath, workspace.rootname)},
      opts
    ),
  ]);

  return {workspaceImagesFolder, userImagesFolder};
}

async function setupImageUploadPermissionGroup(
  context: IBaseContext,
  workspaceId: string,
  name: string,
  description: string,
  folderId: string,
  opts: ISemanticDataAccessProviderMutationRunOptions
) {
  const imageUploadPermissionGroup = newWorkspaceResource(
    SYSTEM_SESSION_AGENT,
    AppResourceType.PermissionGroup,
    workspaceId,
    {name, description}
  );
  const permissionItems: IPermissionItem[] = [BasicCRUDActions.Create, BasicCRUDActions.Read].map(
    action => {
      const item: IPermissionItem = newWorkspaceResource(
        SYSTEM_SESSION_AGENT,
        AppResourceType.PermissionItem,
        workspaceId,
        {
          action,
          containerId: folderId,
          containerType: AppResourceType.Folder,
          entityId: imageUploadPermissionGroup.resourceId,
          entityType: AppResourceType.PermissionGroup,
          targetType: AppResourceType.File,
          grantAccess: true,
        }
      );
      return item;
    }
  );

  await Promise.all([
    await context.semantic.permissionGroup.insertItem(imageUploadPermissionGroup, opts),
    await context.semantic.permissionItem.insertItem(permissionItems, opts),
  ]);

  return imageUploadPermissionGroup;
}

async function isRootWorkspaceSetup(
  context: IBaseContext,
  opts?: ISemanticDataAccessProviderRunOptions
) {
  const appRuntimeState = await context.semantic.appRuntimeState.getOneByLiteralDataQuery(
    EndpointReusableQueries.getByResourceId(APP_RUNTIME_STATE_DOC_ID),
    opts
  );
  return appRuntimeState;
}

async function getRootWorkspace(
  context: IBaseContext,
  appRuntimeState: IAppRuntimeState,
  opts?: ISemanticDataAccessProviderRunOptions
) {
  const appRuntimeVars: IAppRuntimeVars = {
    appWorkspaceId: appRuntimeState.appWorkspaceId,
    appWorkspacesImageUploadPermissionGroupId:
      appRuntimeState.appWorkspacesImageUploadPermissionGroupId,
    appUsersImageUploadPermissionGroupId: appRuntimeState.appUsersImageUploadPermissionGroupId,
  };
  merge(context.appVariables, appRuntimeVars);
  const workspace = await context.semantic.workspace.getOneById(
    appRuntimeState.appWorkspaceId,
    opts
  );
  assertWorkspace(workspace);
  return workspace;
}

export async function setupApp(context: IBaseContext) {
  return await MemStore.withTransaction(context, async transaction => {
    const opts: ISemanticDataAccessProviderMutationRunOptions = {transaction};
    const appRuntimeState = await isRootWorkspaceSetup(context, opts);
    if (appRuntimeState) {
      return await getRootWorkspace(context, appRuntimeState, opts);
    }

    const {adminPermissionGroup, workspace} = await setupWorkspace(
      context,
      appSetupVars.workspaceName,
      appSetupVars.rootname,
      opts
    );

    const [u1, {workspaceImagesFolder, userImagesFolder}] = await Promise.all([
      setupDefaultUserCollaborationRequest(
        context,
        workspace,
        context.appVariables.defaultUserEmailAddress,
        adminPermissionGroup.resourceId,
        opts
      ),
      setupFolders(context, workspace, opts),
    ]);

    const [appWorkspacesImageUploadPermissionGroup, appUsersImageUploadPermissionGroup] =
      await Promise.all([
        setupImageUploadPermissionGroup(
          context,
          workspace.resourceId,
          appSetupVars.workspacesImageUploadPermissionGroupName,
          'Auto-generated permission group for uploading images to the workspace images folder',
          workspaceImagesFolder.resourceId,
          opts
        ),
        setupImageUploadPermissionGroup(
          context,
          workspace.resourceId,
          appSetupVars.usersImageUploadPermissionGroupName,
          'Auto-generated permission group for uploading images to the user images folder',
          userImagesFolder.resourceId,
          opts
        ),
      ]);

    const appRuntimeVars: IAppRuntimeVars = {
      appWorkspaceId: workspace.resourceId,
      appWorkspacesImageUploadPermissionGroupId: appWorkspacesImageUploadPermissionGroup.resourceId,
      appUsersImageUploadPermissionGroupId: appUsersImageUploadPermissionGroup.resourceId,
    };
    await context.semantic.appRuntimeState.insertItem(
      {
        isAppSetup: true,
        resourceId: APP_RUNTIME_STATE_DOC_ID,
        ...appRuntimeVars,
        createdAt: getTimestamp(),
        lastUpdatedAt: getTimestamp(),
      },
      opts
    );
    merge(context.appVariables, appRuntimeVars);

    return workspace;
  });
}
