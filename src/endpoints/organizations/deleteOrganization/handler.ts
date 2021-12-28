import {BasicCRUDActions, SessionAgentType} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
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

  await context.data.organization.deleteItem(
    OrganizationQueries.getById(organization.organizationId)
  );

  

  // TODO:
  // delete program access keys
  // delete client assigned keys
  // remove organizations in users
  // delete files
  // delete folders
  // delete collaborators
  // delete collaboration requests
  // delete presets
  // delete permission items
};

export default deleteOrganization;
