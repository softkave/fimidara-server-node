import {IOrganization} from '../../../definitions/organization';
import {IUser} from '../../../definitions/user';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {IBaseContext} from '../../contexts/BaseContext';
import {environmentConstants} from '../../environments/constants';
import {organizationExtractor} from '../utils';
import {AddOrganizationEndpoint} from './types';
import {addOrganizationJoiSchema} from './validation';

async function createDefaultEnvironment(
  context: IBaseContext,
  user: IUser,
  organization: IOrganization
) {
  await context.environment.saveEnvironment(context, {
    createdAt: getDateString(),
    createdBy: user.userId,
    name: environmentConstants.defaultEnvironmentName,
    environmentId: getNewId(),
    description: environmentConstants.defaultEnvironmentDescription,
    organizationId: organization.organizationId,
  });
}

const addOrganization: AddOrganizationEndpoint = async (context, instData) => {
  const data = validate(instData.data, addOrganizationJoiSchema);
  const user = await context.session.getUser(context, instData);
  const organization = await context.organization.saveOrganization(context, {
    createdAt: getDateString(),
    createdBy: user.userId,
    name: data.organization.name,
    organizationId: getNewId(),
    description: data.organization.description,
  });

  await createDefaultEnvironment(context, user, organization);

  const publicData = organizationExtractor(organization);
  return {
    organization: publicData,
  };
};

export default addOrganization;
