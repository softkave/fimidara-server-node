import {organizationListExtractor} from '../utils';
import {GetUserOrganizationsEndpoint} from './types';

const getUserOrganizations: GetUserOrganizationsEndpoint = async (
  context,
  instData
) => {
  const user = await context.session.getUser(context, instData);
  const organizations = await context.organization.getOrganizationsByIds(
    context,
    user.organizations.map(organization => organization.organizationId)
  );

  return {
    organizations: organizationListExtractor(organizations),
  };
};

export default getUserOrganizations;
