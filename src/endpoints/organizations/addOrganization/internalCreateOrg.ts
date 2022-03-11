import {IAgent} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {IBaseContext} from '../../contexts/BaseContext';
import {OrganizationExistsError} from '../errors';
import OrganizationQueries from '../queries';
import {organizationExtractor} from '../utils';
import {INewOrganizationInput} from './types';
import {
  setupDefaultOrgPresets,
  addOrgToUserAndAssignAdminPreset,
} from './utils';

const internalCreateOrg = async (
  context: IBaseContext,
  data: INewOrganizationInput,
  agent: IAgent,
  user?: IUser
) => {
  const organizationExists = await context.data.organization.checkItemExists(
    OrganizationQueries.getByName(data.name)
  );

  if (organizationExists) {
    throw new OrganizationExistsError();
  }

  let organization = await context.data.organization.saveItem({
    createdAt: getDateString(),
    createdBy: agent,
    name: data.name,
    resourceId: getNewId(),
    description: data.description,
  });

  const {adminPreset, publicPreset} = await setupDefaultOrgPresets(
    context,
    agent,
    organization
  );

  organization = await context.data.organization.assertUpdateItem(
    OrganizationQueries.getById(organization.resourceId),
    {publicPresetId: publicPreset.resourceId}
  );

  if (user) {
    await addOrgToUserAndAssignAdminPreset(
      context,
      user,
      organization,
      adminPreset
    );
  }

  return organization;
};

export default internalCreateOrg;
