import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import OrganizationQueries from '../queries';
import {organizationExtractor} from '../utils';
import {UpdateOrganizationEndpoint} from './types';
import {updateOrganizationJoiSchema} from './validation';

const updateOrganization: UpdateOrganizationEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateOrganizationJoiSchema);
  const user = await context.session.getUser(context, instData);
  const updatedOrganization = await context.data.organization.assertUpdateItem(
    OrganizationQueries.getById(data.organizationId),
    {
      ...data.data,
      lastUpdatedAt: getDateString(),
      lastUpdatedBy: user.userId,
    }
  );

  return {organization: organizationExtractor(updatedOrganization)};
};

export default updateOrganization;
