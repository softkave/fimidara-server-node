import {merge} from 'lodash';
import {CollaborationRequestStatusType} from '../../definitions/collaborationRequest';
import {IPermissionItem, PermissionItemAppliesTo} from '../../definitions/permissionItem';
import {
  AppResourceType,
  APP_RUNTIME_STATE_DOC_ID,
  BasicCRUDActions,
  IAppRuntimeState,
  systemAgent,
} from '../../definitions/system';
import {IWorkspace} from '../../definitions/workspace';
import {IAppRuntimeVars} from '../../resources/vars';
import {getDate, getDateString} from '../../utils/dateFns';
import {getNewIdForResource} from '../../utils/resourceId';
import {addAssignedPermissionGroupList} from '../assignedItems/addAssignedItems';
import {IBaseContext} from '../contexts/types';
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

async function setupWorkspace(context: IBaseContext, name: string, rootname: string) {
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
  const request = await context.data.collaborationRequest.insertItem({
    createdAt,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: systemAgent,
    resourceId: getNewIdForResource(AppResourceType.CollaborationRequest),
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
  const folder01 = await createSingleFolder(context, systemAgent, workspace, null, {
    folderpath: addRootnameToPath(folder01Path, workspace.rootname),
  });

  const folder02 = await createSingleFolder(context, systemAgent, workspace, folder01, {
    folderpath: addRootnameToPath(folder02Path, workspace.rootname),
  });

  const workspaceImagesFolder = await createSingleFolder(context, systemAgent, workspace, folder02, {
    folderpath: addRootnameToPath(appSetupVars.workspaceImagesfolderpath, workspace.rootname),
    publicAccessOps: [
      {
        action: BasicCRUDActions.Read,
        resourceType: AppResourceType.File,
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
      },
    ],
  });

  const userImagesFolder = await createSingleFolder(context, systemAgent, workspace, folder02, {
    folderpath: addRootnameToPath(appSetupVars.userImagesfolderpath, workspace.rootname),
    publicAccessOps: [
      {
        action: BasicCRUDActions.Read,
        resourceType: AppResourceType.File,
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
      },
    ],
  });

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
  const imageUploadPermissionGroup = await context.data.permissiongroup.insertItem({
    name,
    description,
    createdAt,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: systemAgent,
    resourceId: getNewIdForResource(AppResourceType.PermissionGroup),
    workspaceId: workspaceId,
    createdBy: systemAgent,
  });

  const permissionItems: IPermissionItem[] = [BasicCRUDActions.Create, BasicCRUDActions.Read].map(action => {
    const item: IPermissionItem = {
      action,
      hash: '',
      resourceId: getNewIdForResource(AppResourceType.PermissionItem),
      workspaceId: workspaceId,
      createdAt: getDateString(),
      createdBy: systemAgent,
      containerId: folderId,
      containerType: AppResourceType.Folder,
      permissionEntityId: imageUploadPermissionGroup.resourceId,
      permissionEntityType: AppResourceType.PermissionGroup,
      targetType: AppResourceType.File,
      grantAccess: true,
      appliesTo: PermissionItemAppliesTo.Children,
    };

    item.hash = permissionItemIndexer(item);
    return item;
  });

  await context.data.permissionItem.insertList(permissionItems);
  return imageUploadPermissionGroup;
}

async function isRootWorkspaceSetup(context: IBaseContext) {
  const appRuntimeState = await context.data.appRuntimeState.getOneByQuery(
    EndpointReusableQueries.getByResourceId(APP_RUNTIME_STATE_DOC_ID)
  );

  return appRuntimeState;
}

async function getRootWorkspace(context: IBaseContext, appRuntimeState: IAppRuntimeState) {
  const appRuntimeVars: IAppRuntimeVars = {
    appWorkspaceId: appRuntimeState.appWorkspaceId,
    appWorkspacesImageUploadPermissionGroupId: appRuntimeState.appWorkspacesImageUploadPermissionGroupId,
    appUsersImageUploadPermissionGroupId: appRuntimeState.appUsersImageUploadPermissionGroupId,
  };

  merge(context.appVariables, appRuntimeVars);
  const workspace = await context.data.workspace.getOneByQuery(
    EndpointReusableQueries.getByResourceId(appRuntimeState.appWorkspaceId)
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

  const {workspaceImagesFolder, userImagesFolder} = await setupFolders(context, workspace);
  const appWorkspacesImageUploadPermissionGroup = await setupImageUploadPermissionGroup(
    context,
    workspace.resourceId,
    appSetupVars.workspacesImageUploadPermissionGroupName,
    'Auto-generated permission group for uploading images to the workspace images folder',
    workspaceImagesFolder.resourceId
  );

  const appUsersImageUploadPermissionGroup = await setupImageUploadPermissionGroup(
    context,
    workspace.resourceId,
    appSetupVars.usersImageUploadPermissionGroupName,
    'Auto-generated permission group for uploading images to the user images folder',
    userImagesFolder.resourceId
  );

  const appRuntimeVars: IAppRuntimeVars = {
    appWorkspaceId: workspace.resourceId,
    appWorkspacesImageUploadPermissionGroupId: appWorkspacesImageUploadPermissionGroup.resourceId,
    appUsersImageUploadPermissionGroupId: appUsersImageUploadPermissionGroup.resourceId,
  };

  await context.data.appRuntimeState.insertItem({
    isAppSetup: true,
    resourceId: APP_RUNTIME_STATE_DOC_ID,
    ...appRuntimeVars,
  });

  merge(context.appVariables, appRuntimeVars);
  return workspace;
}
