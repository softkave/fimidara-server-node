import {BasicCRUDActions, SessionAgentType} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import CollaboratorQueries from '../../collaborators/queries';
import {IBaseContext} from '../../contexts/BaseContext';
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

/**
 * deleteOrganization. Ensure that:
 * - Get agent and make sure it's a user
 * - Check that org exists and the agent can perform the operation
 * - Delete org and artifacts
 */

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
    context.data.collaborationRequest.deleteManyItems(
      CollaboratorQueries.getByOrganizationId(organization.resourceId)
    ),

    context.data.programAccessToken.deleteManyItems(
      ProgramAccessTokenQueries.getByOrganizationId(organization.resourceId)
    ),

    context.data.clientAssignedToken.deleteManyItems(
      EndpointReusableQueries.getByOrganizationId(organization.resourceId)
    ),

    context.data.preset.deleteManyItems(
      PresetPermissionsGroupQueries.getByOrganizationId(organization.resourceId)
    ),

    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByOrganizationId(organization.resourceId)
    ),

    internalDeleteFoldersByOrganizationId(context, organization.resourceId),
    internalDeleteFilesByOrganizationId(context, organization.resourceId),
    updateCollaborators(context, organization.resourceId),
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
  const collaborators = await context.data.user.getManyItems(
    CollaboratorQueries.getByOrganizationId(organizationId)
  );

  await waitOnPromises(
    collaborators.map(async collaborator => {
      collaborator.organizations = collaborator.organizations.filter(
        item => item.organizationId !== organizationId
      );

      await context.data.user.updateItem(
        EndpointReusableQueries.getById(collaborator.resourceId),
        {organizations: collaborator.organizations}
      );
    })
  );
}

export default deleteOrganization;
