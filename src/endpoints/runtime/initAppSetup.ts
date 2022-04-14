import {CollaborationRequestStatusType} from '../../definitions/collaborationRequest';
import {IWorkspace} from '../../definitions/workspace';
import {
  AppResourceType,
  APP_RUNTIME_STATE_DOC_ID,
  BasicCRUDActions,
  systemAgent,
} from '../../definitions/system';
import {getDate, getDateString} from '../../utilities/dateFns';
import getNewId from '../../utilities/getNewId';
import {IBaseContext} from '../contexts/BaseContext';
import EndpointReusableQueries from '../queries';
import WorkspaceQueries from '../workspaces/queries';
import {createSingleFolder} from '../folders/addFolder/handler';
import {
  IPermissionItem,
  PermissionItemAppliesTo,
} from '../../definitions/permissionItem';
import {IAppRuntimeVars} from '../../resources/appVariables';
import {merge} from 'lodash';
import internalCreateWorkspace from '../workspaces/addWorkspace/internalCreateWorkspace';
import {permissionItemIndexer} from '../permissionItems/utils';
import {addAssignedPresetList} from '../assignedItems/addAssignedItems';

const folder01Path = '/files';
const folder02Path = '/files/images';
const appSetupVars = {
  workspaceName: 'Files by softkave',
  workspacesFolder: '/files-prod/workspaces',
  workspaceImagesfolderpath: folder02Path + '/workspaces',
  userImagesfolderpath: folder02Path + '/users',
  workspacesImageUploadPresetName: 'Files-workspaces-image-upload',
  usersImageUploadPresetName: 'Files-users-image-upload',
};

async function setupWorkspace(context: IBaseContext, name: string) {
  return await internalCreateWorkspace(
    context,
    {
      name,
      description: "System-generated workspace for Files's own operations",
    },
    systemAgent
  );
}

async function setupDefaultUserCollaborationRequest(
  context: IBaseContext,
  workspace: IWorkspace,
  userEmail: string,
  adminPresetId: string
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

  await addAssignedPresetList(
    context,
    systemAgent,
    workspace,
    [{order: 0, presetId: adminPresetId}],
    request.resourceId,
    AppResourceType.CollaborationRequest,
    /** deleteExisting */ false,
    /** skipPresetsCheck */ true
  );
}

async function setupFolders(context: IBaseContext, workspace: IWorkspace) {
  const folder01 = await createSingleFolder(
    context,
    systemAgent,
    workspace,
    null,
    {folderpath: folder01Path}
  );

  const folder02 = await createSingleFolder(
    context,
    systemAgent,
    workspace,
    folder01,
    {folderpath: folder02Path}
  );

  const workspaceImagesFolder = await createSingleFolder(
    context,
    systemAgent,
    workspace,
    folder02,
    {
      folderpath: appSetupVars.workspaceImagesfolderpath,
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
      folderpath: appSetupVars.userImagesfolderpath,
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
  const imageUploadPreset = await context.data.preset.saveItem({
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
      permissionEntityId: imageUploadPreset.resourceId,
      permissionEntityType: AppResourceType.PresetPermissionsGroup,
      itemResourceType: AppResourceType.File,
      grantAccess: true,
      appliesTo: PermissionItemAppliesTo.Children,
    };

    item.hash = permissionItemIndexer(item);
    return item;
  });

  await context.data.permissionItem.bulkSaveItems(permissionItems);
  return imageUploadPreset;
}

export async function setupApp(context: IBaseContext) {
  const appRuntimeState = await context.data.appRuntimeState.getItem(
    EndpointReusableQueries.getById(APP_RUNTIME_STATE_DOC_ID)
  );

  if (appRuntimeState) {
    const appRuntimeVars: IAppRuntimeVars = {
      appWorkspaceId: appRuntimeState.appWorkspaceId,
      appWorkspacesImageUploadPresetId:
        appRuntimeState.appWorkspacesImageUploadPresetId,
      appUsersImageUploadPresetId: appRuntimeState.appUsersImageUploadPresetId,
    };

    merge(context.appVariables, appRuntimeVars);
    return await context.data.workspace.assertGetItem(
      WorkspaceQueries.getById(appRuntimeState.appWorkspaceId)
    );
  }

  const {adminPreset, workspace: workspace} = await setupWorkspace(
    context,
    appSetupVars.workspaceName
  );

  await setupDefaultUserCollaborationRequest(
    context,
    workspace,
    context.appVariables.defaultUserEmailAddress,
    adminPreset.resourceId
  );

  const {workspaceImagesFolder, userImagesFolder} = await setupFolders(
    context,
    workspace
  );
  const appWorkspacesImageUploadPreset = await setupImageUploadPermissionGroup(
    context,
    workspace.resourceId,
    appSetupVars.workspacesImageUploadPresetName,
    'Auto-generated preset for uploading images to the workspace images folder',
    workspaceImagesFolder.resourceId
  );

  const appUsersImageUploadPreset = await setupImageUploadPermissionGroup(
    context,
    workspace.resourceId,
    appSetupVars.usersImageUploadPresetName,
    'Auto-generated preset for uploading images to the user images folder',
    userImagesFolder.resourceId
  );

  const appRuntimeVars: IAppRuntimeVars = {
    appWorkspaceId: workspace.resourceId,
    appWorkspacesImageUploadPresetId: appWorkspacesImageUploadPreset.resourceId,
    appUsersImageUploadPresetId: appUsersImageUploadPreset.resourceId,
  };

  await context.data.appRuntimeState.saveItem({
    isAppSetup: true,
    resourceId: APP_RUNTIME_STATE_DOC_ID,
    ...appRuntimeVars,
  });

  merge(context.appVariables, appRuntimeVars);
  return workspace;
}
