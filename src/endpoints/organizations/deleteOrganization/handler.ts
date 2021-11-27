import {BasicCRUDActions, SessionAgentType} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import OrganizationQueries from '../queries';
import {checkOrganizationAuthorizationWithId} from '../utils';
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

  const {organization} = await checkOrganizationAuthorizationWithId(
    context,
    agent,
    data.organizationId,
    BasicCRUDActions.Delete
  );

  await context.data.organization.deleteItem(
    OrganizationQueries.getById(organization.organizationId)
  );

  // TODO:
  // delete environments
  // delete spaces
  // delete buckets
  // delete program access keys
  // delete client assigned keys
  // remove organizations in users
  // delete files
};

export default deleteOrganization;
