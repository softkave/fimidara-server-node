import {BasicCRUDActions, SessionAgentType} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import ClientAssignedTokenQueries from '../../clientAssignedTokens/queries';
import CollaboratorQueries from '../../collaborators/queries';
import {IBaseContext} from '../../contexts/BaseContext';
import FileQueries from '../../files/queries';
import {internalDeleteFolderList} from '../../folders/deleteFolder/handler';
import FolderQueries from '../../folders/queries';
import PermissionItemQueries from '../../permissionItems/queries';
import PresetPermissionsGroupQueries from '../../presetPermissionsGroups/queries';
import ProgramAccessTokenQueries from '../../programAccessTokens/queries';
import OrganizationQueries from '../queries';
import {checkOrganizationAuthorization02} from '../utils';
import {DeleteOrganizationEndpoint} from './types';
import {deleteOrganizationJoiSchema} from './validation';

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
    keys: files.map(file => file.fileId),
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
        CollaboratorQueries.getById(collaborator.userId),
        {organizations: collaborator.organizations}
      );
    })
  );
}

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
      CollaboratorQueries.getByOrganizationId(organization.organizationId)
    ),

    context.data.programAccessToken.deleteManyItems(
      ProgramAccessTokenQueries.getByOrganizationId(organization.organizationId)
    ),

    context.data.clientAssignedToken.deleteManyItems(
      ClientAssignedTokenQueries.getByOrganizationId(
        organization.organizationId
      )
    ),

    context.data.presetPermissionsGroup.deleteManyItems(
      PresetPermissionsGroupQueries.getByOrganizationId(
        organization.organizationId
      )
    ),

    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByOrganizationId(organization.organizationId)
    ),

    internalDeleteFoldersByOrganizationId(context, organization.organizationId),
    internalDeleteFilesByOrganizationId(context, organization.organizationId),
    updateCollaborators(context, organization.organizationId),
    context.data.organization.deleteItem(
      OrganizationQueries.getById(organization.organizationId)
    ),
  ]);
};

export default deleteOrganization;
