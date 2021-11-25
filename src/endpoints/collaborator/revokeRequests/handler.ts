import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {OrganizationExistsError} from '../errors';
import {organizationExtractor} from '../utils';
import {AddOrganizationEndpoint} from './types';
import {addOrganizationJoiSchema} from './validation';

const addOrganization: AddOrganizationEndpoint = async (context, instData) => {
  const data = validate(instData.data, addOrganizationJoiSchema);
  const user = await context.session.getUser(context, instData);

  if (
    await context.organization.organizationExists(
      context,
      data.organization.name
    )
  ) {
    throw new OrganizationExistsError();
  }

  const organization = await context.organization.saveOrganization(context, {
    createdAt: getDateString(),
    createdBy: user.userId,
    name: data.organization.name,
    organizationId: getNewId(),
    description: data.organization.description,
  });

  const publicData = organizationExtractor(organization);
  return {
    organization: publicData,
  };
};

export default addOrganization;