import {merge} from 'lodash';
import {
  CollaborationRequest,
  CollaborationRequestStatusType,
} from '../../definitions/collaborationRequest';
import {PermissionGroup} from '../../definitions/permissionGroups';
import {PermissionItem, PermissionItemAppliesTo} from '../../definitions/permissionItem';
import {AppActionType, AppResourceType, AppRuntimeState} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {AppRuntimeVars} from '../../resources/vars';
import {SYSTEM_SESSION_AGENT} from '../../utils/agent';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {newWorkspaceResource} from '../../utils/fns';
import {ID_SIZE, getNewIdForResource} from '../../utils/resource';
import {addAssignedPermissionGroupList} from '../assignedItems/addAssignedItems';
import {MemStore} from '../contexts/mem/Mem';
import {
  ISemanticDataAccessProviderRunOptions,
  SemanticDataAccessProviderMutationRunOptions,
} from '../contexts/semantic/types';
import {BaseContext} from '../contexts/types';
import {createFolderList} from '../folders/addFolder/handler';
import {addRootnameToPath} from '../folders/utils';
import EndpointReusableQueries from '../queries';
import internalCreateWorkspace from '../workspaces/addWorkspace/internalCreateWorkspace';
import {assertWorkspace} from '../workspaces/utils';

export const APP_RUNTIME_STATE_DOC_ID = getNewIdForResource(AppResourceType.System, ID_SIZE, true);
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
  context: BaseContext,
  name: string,
  rootname: string,
  opts: SemanticDataAccessProviderMutationRunOptions
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
  context: BaseContext,
  workspace: Workspace,
  userEmail: string,
  adminPermissionGroupId: string,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  const request = newWorkspaceResource<CollaborationRequest>(
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
    /** skip auth check */ true,
    opts
  );
}

async function setupFolders(
  context: BaseContext,
  workspace: Workspace,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  const [workspaceImagesFolder, userImagesFolder] = await Promise.all([
    createFolderList(
      context,
      SYSTEM_SESSION_AGENT,
      workspace,
      {folderpath: addRootnameToPath(appSetupVars.workspaceImagesfolderpath, workspace.rootname)},
      opts,
      /** skip auth check */ true
    ),
    createFolderList(
      context,
      SYSTEM_SESSION_AGENT,
      workspace,
      {folderpath: addRootnameToPath(appSetupVars.userImagesfolderpath, workspace.rootname)},
      opts,
      /** skip auth check */ true
    ),
  ]);

  appAssert(workspaceImagesFolder && userImagesFolder);
  return {workspaceImagesFolder, userImagesFolder};
}

async function setupImageUploadPermissionGroup(
  context: BaseContext,
  workspaceId: string,
  name: string,
  description: string,
  folderId: string,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  const imageUploadPermissionGroup = newWorkspaceResource<PermissionGroup>(
    SYSTEM_SESSION_AGENT,
    AppResourceType.PermissionGroup,
    workspaceId,
    {name, description}
  );
  const permissionItems: PermissionItem[] = [AppActionType.Create, AppActionType.Read].map(
    action => {
      const item: PermissionItem = newWorkspaceResource<PermissionItem>(
        SYSTEM_SESSION_AGENT,
        AppResourceType.PermissionItem,
        workspaceId,
        {
          action,
          entityId: imageUploadPermissionGroup.resourceId,
          entityType: AppResourceType.PermissionGroup,
          targetId: folderId,
          targetType: AppResourceType.File,
          grantAccess: true,
          appliesTo: PermissionItemAppliesTo.ChildrenOfType,
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
  context: BaseContext,
  opts?: ISemanticDataAccessProviderRunOptions
) {
  const appRuntimeState = await context.data.appRuntimeState.getOneByQuery(
    EndpointReusableQueries.getByResourceId(APP_RUNTIME_STATE_DOC_ID)
  );
  return appRuntimeState;
}

async function getRootWorkspace(
  context: BaseContext,
  appRuntimeState: AppRuntimeState,
  opts?: ISemanticDataAccessProviderRunOptions
) {
  const appRuntimeVars: AppRuntimeVars = {
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

export async function setupApp(context: BaseContext) {
  return await MemStore.withTransaction(context, async transaction => {
    const opts: SemanticDataAccessProviderMutationRunOptions = {transaction};
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

    const appRuntimeVars: AppRuntimeVars = {
      appWorkspaceId: workspace.resourceId,
      appWorkspacesImageUploadPermissionGroupId: appWorkspacesImageUploadPermissionGroup.resourceId,
      appUsersImageUploadPermissionGroupId: appUsersImageUploadPermissionGroup.resourceId,
    };
    await context.data.appRuntimeState.insertItem({
      isAppSetup: true,
      resourceId: APP_RUNTIME_STATE_DOC_ID,
      ...appRuntimeVars,
      createdAt: getTimestamp(),
      lastUpdatedAt: getTimestamp(),
    });
    merge(context.appVariables, appRuntimeVars);

    return workspace;
  });
}
