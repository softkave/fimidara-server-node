import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {organizationExtractor} from '../utils';
import {AddOrganizationEndpoint} from './types';
import {addOrganizationJoiSchema} from './validation';

const addOrganization: AddOrganizationEndpoint = async (context, instData) => {
  const data = validate(instData.data, addOrganizationJoiSchema);
  const user = await context.session.getUser(context, instData);
  const organization = await context.data.organization.saveItem({
    createdAt: getDateString(),
    createdBy: user.userId,
    name: data.organization.name,
    organizationId: getNewId(),
    description: data.organization.description,
  });

  return {
    organization: organizationExtractor(organization),
  };
};

export default addOrganization;
