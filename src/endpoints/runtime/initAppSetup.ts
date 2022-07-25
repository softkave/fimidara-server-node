import {merge} from 'lodash';
import {CollaborationRequestStatusType} from '../../definitions/collaborationRequest';
import {
  IPermissionItem,
  PermissionItemAppliesTo,
} from '../../definitions/permissionItem';
import {
  AppResourceType,
  APP_RUNTIME_STATE_DOC_ID,
  BasicCRUDActions,
  IAppRuntimeState,
  systemAgent,
} from '../../definitions/system';
import {IWorkspace} from '../../definitions/workspace';
import {IAppRuntimeVars} from '../../resources/appVariables';
import {getDate, getDateString} from '../../utilities/dateFns';
import getNewId from '../../utilities/getNewId';
import {addAssignedPermissionGroupList} from '../assignedItems/addAssignedItems';
import {IBaseContext} from '../contexts/BaseContext';
import {createSingleFolder} from '../folders/addFolder/handler';
import {addRootnameToPath} from '../folders/utils';
import {permissionItemIndexer} from '../permissionItems/utils';
import EndpointReusableQueries from '../queries';
import internalCreateWorkspace from '../workspaces/addWorkspace/internalCreateWorkspace';
import {assertWorkspace} from '../workspaces/utils';

const folder01Path = '/files';
const folder02Path = '/files/images';
const appSetupVars = {
  workspaceName: 'Fimidara',
  rootname: 'fimidara',
  workspaceImagesfolderpath: folder02Path + '/workspaces',
  userImagesfolderpath: folder02Path + '/users',
  workspacesImageUploadPermissionGroupName: 'Fimidara-workspaces-image-upload',
  usersImageUploadPermissionGroupName: 'Fimidara-users-image-upload',
};

async function setupWorkspace(
  context: IBaseContext,
  name: string,
  rootname: string
) {
  return await internalCreateWorkspace(
    context,
    {
      name,
      rootname,
      description: "System-generated workspace for Fimidara's own operations",
    },
    systemAgent
  );
}

async function setupDefaultUserCollaborationRequest(
  context: IBaseContext,
  workspace: IWorkspace,
  userEmail: string,
  adminPermissionGroupId: string
) {
  const createdAt = getDate();
  const request = await context.data.collaborationRequest.saveItem({
    createdAt,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: systemAgent,
    resourceId: getNewId(),
    createdBy: systemAgent,
    message:
      'System-generated collaboration request ' +
      "to the system-generated workspace that manages File's " +
      'own operations',
    workspaceName: workspace.name,
    workspaceId: workspace.resourceId,
    recipientEmail: userEmail,
    statusHistory: [
      {
        status: CollaborationRequestStatusType.Pending,
        date: createdAt,
      },
    ],
  });

  await addAssignedPermissionGroupList(
    context,
    systemAgent,
    workspace,
    [{order: 0, permissionGroupId: adminPermissionGroupId}],
    request.resourceId,
    AppResourceType.CollaborationRequest,
    /** deleteExisting */ false,
    /** skipPermissionGroupsCheck */ true
  );
}

async function setupFolders(context: IBaseContext, workspace: IWorkspace) {
  const folder01 = await createSingleFolder(
    context,
    systemAgent,
    workspace,
    null,
    {folderpath: addRootnameToPath(folder01Path, workspace.rootname)}
  );

  const folder02 = await createSingleFolder(
    context,
    systemAgent,
    workspace,
    folder01,
    {folderpath: addRootnameToPath(folder02Path, workspace.rootname)}
  );

  const workspaceImagesFolder = await createSingleFolder(
    context,
    systemAgent,
    workspace,
    folder02,
    {
      folderpath: addRootnameToPath(
        appSetupVars.workspaceImagesfolderpath,
        workspace.rootname
      ),
      publicAccessOps: [
        {action: BasicCRUDActions.Read, resourceType: AppResourceType.File},
      ],
    }
  );

  const userImagesFolder = await createSingleFolder(
    context,
    systemAgent,
    workspace,
    folder02,
    {
      folderpath: addRootnameToPath(
        appSetupVars.userImagesfolderpath,
        workspace.rootname
      ),
      publicAccessOps: [
        {action: BasicCRUDActions.Read, resourceType: AppResourceType.File},
      ],
    }
  );

  return {folder01, folder02, workspaceImagesFolder, userImagesFolder};
}

async function setupImageUploadPermissionGroup(
  context: IBaseContext,
  workspaceId: string,
  name: string,
  description: string,
  folderId: string
) {
  const createdAt = getDate();
  const imageUploadPermissionGroup =
    await context.data.permissiongroup.saveItem({
      name,
      description,
      createdAt,
      lastUpdatedAt: createdAt,
      lastUpdatedBy: systemAgent,
      resourceId: getNewId(),
      workspaceId: workspaceId,
      createdBy: systemAgent,
    });

  const permissionItems: IPermissionItem[] = [
    BasicCRUDActions.Create,
    BasicCRUDActions.Read,
  ].map(action => {
    const item: IPermissionItem = {
      action,
      hash: '',
      resourceId: getNewId(),
      workspaceId: workspaceId,
      createdAt: getDateString(),
      createdBy: systemAgent,
      permissionOwnerId: folderId,
      permissionOwnerType: AppResourceType.Folder,
      permissionEntityId: imageUploadPermissionGroup.resourceId,
      permissionEntityType: AppResourceType.PermissionGroup,
      itemResourceType: AppResourceType.File,
      grantAccess: true,
      appliesTo: PermissionItemAppliesTo.Children,
    };

    item.hash = permissionItemIndexer(item);
    return item;
  });

  await context.data.permissionItem.bulkSaveItems(permissionItems);
  return imageUploadPermissionGroup;
}

async function isRootWorkspaceSetup(context: IBaseContext) {
  const appRuntimeState = await context.data.appRuntimeState.getItem(
    EndpointReusableQueries.getById(APP_RUNTIME_STATE_DOC_ID)
  );

  return appRuntimeState;
}

async function getRootWorkspace(
  context: IBaseContext,
  appRuntimeState: IAppRuntimeState
) {
  const appRuntimeVars: IAppRuntimeVars = {
    appWorkspaceId: appRuntimeState.appWorkspaceId,
    appWorkspacesImageUploadPermissionGroupId:
      appRuntimeState.appWorkspacesImageUploadPermissionGroupId,
    appUsersImageUploadPermissionGroupId:
      appRuntimeState.appUsersImageUploadPermissionGroupId,
  };

  merge(context.appVariables, appRuntimeVars);
  const workspace = await context.cacheProviders.workspace.getById(
    context,
    appRuntimeState.appWorkspaceId
  );

  assertWorkspace(workspace);
  return workspace;
}

export async function setupApp(context: IBaseContext) {
  const appRuntimeState = await isRootWorkspaceSetup(context);
  if (appRuntimeState) {
    return await getRootWorkspace(context, appRuntimeState);
  }

  const {adminPermissionGroup, workspace} = await setupWorkspace(
    context,
    appSetupVars.workspaceName,
    appSetupVars.rootname
  );

  await setupDefaultUserCollaborationRequest(
    context,
    workspace,
    context.appVariables.defaultUserEmailAddress,
    adminPermissionGroup.resourceId
  );

  const {workspaceImagesFolder, userImagesFolder} = await setupFolders(
    context,
    workspace
  );

  const appWorkspacesImageUploadPermissionGroup =
    await setupImageUploadPermissionGroup(
      context,
      workspace.resourceId,
      appSetupVars.workspacesImageUploadPermissionGroupName,
      'Auto-generated permission group for uploading images to the workspace images folder',
      workspaceImagesFolder.resourceId
    );

  const appUsersImageUploadPermissionGroup =
    await setupImageUploadPermissionGroup(
      context,
      workspace.resourceId,
      appSetupVars.usersImageUploadPermissionGroupName,
      'Auto-generated permission group for uploading images to the user images folder',
      userImagesFolder.resourceId
    );

  const appRuntimeVars: IAppRuntimeVars = {
    appWorkspaceId: workspace.resourceId,
    appWorkspacesImageUploadPermissionGroupId:
      appWorkspacesImageUploadPermissionGroup.resourceId,
    appUsersImageUploadPermissionGroupId:
      appUsersImageUploadPermissionGroup.resourceId,
  };

  await context.data.appRuntimeState.saveItem({
    isAppSetup: true,
    resourceId: APP_RUNTIME_STATE_DOC_ID,
    ...appRuntimeVars,
  });

  merge(context.appVariables, appRuntimeVars);
  return workspace;
}
