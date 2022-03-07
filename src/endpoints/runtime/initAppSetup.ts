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
import {setupAdminPreset} from '../organizations/addOrganization/utils';
import {createSingleFolder} from '../folders/addFolder/handler';
import {IPermissionItem} from '../../definitions/permissionItem';
import {IAppRuntimeVars} from '../../resources/appVariables';
import {merge} from 'lodash';

/**
 * isAppSetup
 * - yes, do nothing
 * - no
 *   - create organization
 *   - setup admin preset
 *   - create collaboration request for default user
 *   - create image folders
 *   - create permission groups for uploading to the folders
 *   - update app setup state
 */

const folder01Path = '/files';
const folder02Path = '/files/images';
const appSetupVars = {
  orgName: 'files-by-softkave',
  orgImagesFolderPath: folder02Path + '/orgs',
  userImagesFolderPath: folder02Path + '/users',
  orgsImageUploadPresetName: 'files-orgs-image-upload',
  usersImageUploadPresetName: 'files-users-image-upload',
};

async function setupOrg(context: IBaseContext, name: string) {
  const organization = await context.data.organization.saveItem({
    name,
    createdAt: getDateString(),
    createdBy: systemAgent,
    resourceId: getNewId(),
    description: "System-generated organization for Files's own operations",
  });

  return organization;
}

async function setupDefaultUserCollaborationRequest(
  context: IBaseContext,
  organization: IOrganization,
  userEmail: string,
  adminPresetId: string
) {
  await context.data.collaborationRequest.saveItem({
    resourceId: getNewId(),
    createdAt: getDateString(),
    createdBy: systemAgent,
    message:
      'System-generated collaboration request ' +
      "to the system-generated organization that manages File's " +
      'own operations.',
    organizationName: organization.name,
    organizationId: organization.resourceId,
    recipientEmail: userEmail,
    sentEmailHistory: [],
    statusHistory: [
      {
        status: CollaborationRequestStatusType.Pending,
        date: getDateString(),
      },
    ],

    // TODO: open up to the endpoint.
    // Currently only in use for the app init setup.
    assignedPresetsOnAccept: [
      {
        assignedAt: getDateString(),
        assignedBy: systemAgent,
        order: 0,
        presetId: adminPresetId,
      },
    ],
  });
}

async function setupFolders(context: IBaseContext, organizationId: string) {
  const folder01 = await createSingleFolder(
    context,
    systemAgent,
    organizationId,
    null,
    {path: folder01Path}
  );

  const folder02 = await createSingleFolder(
    context,
    systemAgent,
    organizationId,
    folder01,
    {path: folder02Path}
  );

  const orgImagesFolder = await createSingleFolder(
    context,
    systemAgent,
    organizationId,
    folder02,
    {path: appSetupVars.orgImagesFolderPath, isPublic: true}
  );

  const userImagesFolder = await createSingleFolder(
    context,
    systemAgent,
    organizationId,
    folder02,
    {path: appSetupVars.userImagesFolderPath, isPublic: true}
  );

  return {folder01, folder02, orgImagesFolder, userImagesFolder};
}

async function setupImageUploadPermissionGroup(
  context: IBaseContext,
  orgId: string,
  name: string,
  folderId: string
) {
  const imageUploadPreset = await context.data.preset.saveItem({
    name,
    resourceId: getNewId(),
    organizationId: orgId,
    createdAt: getDateString(),
    createdBy: systemAgent,
    description: 'Auto-generated preset for uploading images.',
    presets: [],
  });

  const permissionItems: IPermissionItem[] = [
    BasicCRUDActions.Create,
    BasicCRUDActions.Read,
  ].map(action => ({
    action,
    resourceId: getNewId(),
    organizationId: orgId,
    createdAt: getDateString(),
    createdBy: systemAgent,
    permissionOwnerId: folderId,
    permissionOwnerType: AppResourceType.Folder,
    permissionEntityId: imageUploadPreset.resourceId,
    permissionEntityType: AppResourceType.PresetPermissionsGroup,
    itemResourceType: AppResourceType.File,
  }));

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

  const org = await setupOrg(context, appSetupVars.orgName);
  const adminPreset = await setupAdminPreset(context, systemAgent, org);
  await setupDefaultUserCollaborationRequest(
    context,
    org,
    context.appVariables.defaultUserEmailAddress,
    adminPreset.resourceId
  );

  const {orgImagesFolder, userImagesFolder} = await setupFolders(
    context,
    org.resourceId
  );

  const appOrgsImageUploadPreset = await setupImageUploadPermissionGroup(
    context,
    org.resourceId,
    appSetupVars.orgsImageUploadPresetName,
    orgImagesFolder.resourceId
  );

  const appUsersImageUploadPreset = await setupImageUploadPermissionGroup(
    context,
    org.resourceId,
    appSetupVars.orgsImageUploadPresetName,
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
