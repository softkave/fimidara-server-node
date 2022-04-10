import {CollaborationRequestStatusType} from '../../definitions/collaborationRequest';
import {IOrganization} from '../../definitions/organization';
import {
  AppResourceType,
  APP_RUNTIME_STATE_DOC_ID,
  BasicCRUDActions,
  systemAgent,
} from '../../definitions/system';
import {getDateString} from '../../utilities/dateFns';
import getNewId from '../../utilities/getNewId';
import {IBaseContext} from '../contexts/BaseContext';
import EndpointReusableQueries from '../queries';
import OrganizationQueries from '../organizations/queries';
import {createSingleFolder} from '../folders/addFolder/handler';
import {
  IPermissionItem,
  PermissionItemAppliesTo,
} from '../../definitions/permissionItem';
import {IAppRuntimeVars} from '../../resources/appVariables';
import {merge} from 'lodash';
import internalCreateOrg from '../organizations/addOrganization/internalCreateOrg';
import {permissionItemIndexer} from '../permissionItems/utils';
import {addAssignedPresetList} from '../assignedItems/addAssignedItems';

const folder01Path = '/files';
const folder02Path = '/files/images';
const appSetupVars = {
  orgName: 'Files by softkave',
  orgsFolder: '/files-prod/orgs',
  orgImagesfolderpath: folder02Path + '/orgs',
  userImagesfolderpath: folder02Path + '/users',
  orgsImageUploadPresetName: 'Files-orgs-image-upload',
  usersImageUploadPresetName: 'Files-users-image-upload',
};

async function setupOrg(context: IBaseContext, name: string) {
  return await internalCreateOrg(
    context,
    {
      name,
      description: "System-generated organization for Files's own operations",
    },
    systemAgent
  );
}

async function setupDefaultUserCollaborationRequest(
  context: IBaseContext,
  organization: IOrganization,
  userEmail: string,
  adminPresetId: string
) {
  const request = await context.data.collaborationRequest.saveItem({
    resourceId: getNewId(),
    createdAt: getDateString(),
    createdBy: systemAgent,
    message:
      'System-generated collaboration request ' +
      "to the system-generated organization that manages File's " +
      'own operations',
    organizationName: organization.name,
    organizationId: organization.resourceId,
    recipientEmail: userEmail,
    statusHistory: [
      {
        status: CollaborationRequestStatusType.Pending,
        date: getDateString(),
      },
    ],
  });

  await addAssignedPresetList(
    context,
    systemAgent,
    organization,
    [{order: 0, presetId: adminPresetId}],
    request.resourceId,
    AppResourceType.CollaborationRequest,
    false
  );
}

async function setupFolders(
  context: IBaseContext,
  organization: IOrganization
) {
  const folder01 = await createSingleFolder(
    context,
    systemAgent,
    organization,
    null,
    {folderpath: folder01Path}
  );

  const folder02 = await createSingleFolder(
    context,
    systemAgent,
    organization,
    folder01,
    {folderpath: folder02Path}
  );

  const orgImagesFolder = await createSingleFolder(
    context,
    systemAgent,
    organization,
    folder02,
    {
      folderpath: appSetupVars.orgImagesfolderpath,
      publicAccessOps: [
        {action: BasicCRUDActions.Read, resourceType: AppResourceType.File},
      ],
    }
  );

  const userImagesFolder = await createSingleFolder(
    context,
    systemAgent,
    organization,
    folder02,
    {
      folderpath: appSetupVars.userImagesfolderpath,
      publicAccessOps: [
        {action: BasicCRUDActions.Read, resourceType: AppResourceType.File},
      ],
    }
  );

  return {folder01, folder02, orgImagesFolder, userImagesFolder};
}

async function setupImageUploadPermissionGroup(
  context: IBaseContext,
  orgId: string,
  name: string,
  description: string,
  folderId: string
) {
  const imageUploadPreset = await context.data.preset.saveItem({
    name,
    description,
    resourceId: getNewId(),
    organizationId: orgId,
    createdAt: getDateString(),
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
      organizationId: orgId,
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
      appOrganizationId: appRuntimeState.appOrganizationId,
      appOrgsImageUploadPresetId: appRuntimeState.appOrgsImageUploadPresetId,
      appUsersImageUploadPresetId: appRuntimeState.appUsersImageUploadPresetId,
    };

    merge(context.appVariables, appRuntimeVars);
    return await context.data.organization.assertGetItem(
      OrganizationQueries.getById(appRuntimeState.appOrganizationId)
    );
  }

  const {adminPreset, organization: org} = await setupOrg(
    context,
    appSetupVars.orgName
  );

  await setupDefaultUserCollaborationRequest(
    context,
    org,
    context.appVariables.defaultUserEmailAddress,
    adminPreset.resourceId
  );

  const {orgImagesFolder, userImagesFolder} = await setupFolders(context, org);
  const appOrgsImageUploadPreset = await setupImageUploadPermissionGroup(
    context,
    org.resourceId,
    appSetupVars.orgsImageUploadPresetName,
    'Auto-generated preset for uploading images to the organization images folder',
    orgImagesFolder.resourceId
  );

  const appUsersImageUploadPreset = await setupImageUploadPermissionGroup(
    context,
    org.resourceId,
    appSetupVars.usersImageUploadPresetName,
    'Auto-generated preset for uploading images to the user images folder',
    userImagesFolder.resourceId
  );

  const appRuntimeVars: IAppRuntimeVars = {
    appOrganizationId: org.resourceId,
    appOrgsImageUploadPresetId: appOrgsImageUploadPreset.resourceId,
    appUsersImageUploadPresetId: appUsersImageUploadPreset.resourceId,
  };

  await context.data.appRuntimeState.saveItem({
    isAppSetup: true,
    resourceId: APP_RUNTIME_STATE_DOC_ID,
    ...appRuntimeVars,
  });

  merge(context.appVariables, appRuntimeVars);
  return org;
}
