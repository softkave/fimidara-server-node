import {
  AppResourceType,
  BasicCRUDActions,
  SessionAgentType,
} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import {deleteAssignableItemAssignedItems} from '../../assignedItems/deleteAssignedItems';
import CollaboratorQueries from '../../collaborators/queries';
import {IBaseContext} from '../../contexts/BaseContext';
import {deleteFileAndArtifacts} from '../../files/deleteFile/handler';
import FileQueries from '../../files/queries';
import {internalDeleteFolderList} from '../../folders/deleteFolder/handler';
import FolderQueries from '../../folders/queries';
import PermissionItemQueries from '../../permissionItems/queries';
import PresetPermissionsGroupQueries from '../../presetPermissionsGroups/queries';
import ProgramAccessTokenQueries from '../../programAccessTokens/queries';
import EndpointReusableQueries from '../../queries';
import OrganizationQueries from '../queries';
import {checkOrganizationAuthorization02} from '../utils';
import {DeleteOrganizationEndpoint} from './types';
import {deleteOrganizationJoiSchema} from './validation';

const deleteOrganization: DeleteOrganizationEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deleteOrganizationJoiSchema);
  const agent = await context.session.getAgent(context, instData, [
    SessionAgentType.User,
  ]);

  const {organization} = await checkOrganizationAuthorization02(
    context,
    agent,
    data.organizationId,
    BasicCRUDActions.Delete
  );

  await waitOnPromises([
    // Collaboration requests
    context.data.collaborationRequest.deleteManyItems(
      CollaboratorQueries.getByOrganizationId(organization.resourceId)
    ),

    // Program tokens
    context.data.programAccessToken.deleteManyItems(
      ProgramAccessTokenQueries.getByOrganizationId(organization.resourceId)
    ),

    // Client tokens
    context.data.clientAssignedToken.deleteManyItems(
      EndpointReusableQueries.getByOrganizationId(organization.resourceId)
    ),

    // Presets
    context.data.preset.deleteManyItems(
      EndpointReusableQueries.getByOrganizationId(organization.resourceId)
    ),

    // Permission items
    context.data.permissionItem.deleteManyItems(
      EndpointReusableQueries.getByOrganizationId(organization.resourceId)
    ),

    // Tags
    context.data.tag.deleteManyItems(
      EndpointReusableQueries.getByOrganizationId(organization.resourceId)
    ),

    // Assigned items
    context.data.assignedItem.deleteManyItems(
      EndpointReusableQueries.getByOrganizationId(organization.resourceId)
    ),

    // Folders
    // TODO: deleting folders this way may be more expensive, when we can
    // possibly one-shot it since we're deleting the entire organization
    internalDeleteFoldersByOrganizationId(context, organization.resourceId),

    // Files
    internalDeleteFilesByOrganizationId(context, organization.resourceId),

    // Remove collaborators
    updateCollaborators(context, organization.resourceId),

    //  Delete the organization
    context.data.organization.deleteItem(
      OrganizationQueries.getById(organization.resourceId)
    ),
  ]);
};

async function internalDeleteFilesByOrganizationId(
  context: IBaseContext,
  organizationId: string
) {
  // TODO: should we get files by name path, paginated
  const files = await context.data.file.getManyItems(
    FileQueries.getRootFiles(organizationId)
  );

  await context.data.file.deleteManyItems(
    FileQueries.getRootFiles(organizationId)
  );

  await context.fileBackend.deleteFiles({
    bucket: context.appVariables.S3Bucket,
    keys: files.map(file => file.resourceId),
  });
}

async function internalDeleteFoldersByOrganizationId(
  context: IBaseContext,
  organizationId: string
) {
  await internalDeleteFolderList(
    context,
    await context.data.folder.getManyItems(
      // Root folders
      FolderQueries.getRootFolders(organizationId)
    )
  );
}

async function updateCollaborators(
  context: IBaseContext,
  organizationId: string
) {
  await deleteAssignableItemAssignedItems(
    context,
    organizationId,
    organizationId,
    AppResourceType.Organization
  );
}

export default deleteOrganization;
