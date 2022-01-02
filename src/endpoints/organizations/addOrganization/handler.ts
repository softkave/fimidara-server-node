import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {organizationExtractor} from '../utils';
import {AddOrganizationEndpoint} from './types';
import {addOrganizationJoiSchema} from './validation';

/**
 * addOrganization. Ensure that:
 * - Create and return organization
 */

const addOrganization: AddOrganizationEndpoint = async (context, instData) => {
  const data = validate(instData.data, addOrganizationJoiSchema);
  const user = await context.session.getUser(context, instData);
  const organization = await context.data.organization.saveItem({
    createdAt: getDateString(),
    createdBy: user.userId,
    name: data.name,
    organizationId: getNewId(),
    description: data.description,
  });

  return {
    organization: organizationExtractor(organization),
  };
};

export default addOrganization;
