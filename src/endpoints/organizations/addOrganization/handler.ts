import {IAgent, SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {OrganizationExistsError} from '../errors';
import OrganizationQueries from '../queries';
import {organizationExtractor} from '../utils';
import {AddOrganizationEndpoint} from './types';
import {
  setupDefaultOrgPresets,
  addOrgToUserAndAssignAdminPreset,
} from './utils';
import {addOrganizationJoiSchema} from './validation';

/**
 * addOrganization. Ensure that:
 * - Create and return organization
 */

const addOrganization: AddOrganizationEndpoint = async (context, instData) => {
  const data = validate(instData.data, addOrganizationJoiSchema);
  const user = await context.session.getUser(context, instData);
  const organizationExists = await context.data.organization.checkItemExists(
    OrganizationQueries.getByName(data.name)
  );

  if (organizationExists) {
    throw new OrganizationExistsError();
  }

  let organization = await context.data.organization.saveItem({
    createdAt: getDateString(),
    createdBy: {
      agentId: user.resourceId,
      agentType: SessionAgentType.User,
    },
    name: data.name,
    resourceId: getNewId(),
    description: data.description,
  });

  const agent: IAgent = {
    agentId: user.resourceId,
    agentType: SessionAgentType.User,
  };

  const {adminPreset, publicPreset} = await setupDefaultOrgPresets(
    context,
    agent,
    organization
  );

  organization = await context.data.organization.assertUpdateItem(
    OrganizationQueries.getById(organization.resourceId),
    {publicPresetId: publicPreset.resourceId}
  );

  await addOrgToUserAndAssignAdminPreset(
    context,
    user,
    organization,
    adminPreset
  );

  return {
    organization: organizationExtractor(organization),
  };
};

export default addOrganization;
