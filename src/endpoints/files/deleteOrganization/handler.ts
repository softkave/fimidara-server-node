import {validate} from '../../../utilities/validate';
import {DeleteOrganizationEndpoint} from './types';
import {deleteOrganizationJoiSchema} from './validation';

const deleteOrganization: DeleteOrganizationEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deleteOrganizationJoiSchema);
  await context.session.assertUser(context, instData);
  await context.organization.deleteOrganization(context, data.organizationId);

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
