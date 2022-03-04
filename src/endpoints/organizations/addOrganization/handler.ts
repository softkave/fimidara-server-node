import {IAgent, SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {updateCollaboratorOrganization} from '../../collaborators/utils';
import EndpointReusableQueries from '../../queries';
import {OrganizationExistsError} from '../errors';
import OrganizationQueries from '../queries';
import {organizationExtractor} from '../utils';
import {AddOrganizationEndpoint} from './types';
import {setupAdminPreset, assignAdminPresetToUser} from './utils';
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

  const organization = await context.data.organization.saveItem({
    createdAt: getDateString(),
    createdBy: {
      agentId: user.resourceId,
      agentType: SessionAgentType.User,
    },
    name: data.name,
    resourceId: getNewId(),
    description: data.description,
  });

  updateCollaboratorOrganization(user, organization.resourceId, () => ({
    organizationId: organization.resourceId,
    joinedAt: getDateString(),
    presets: [],
  }));

  await context.data.user.updateItem(
    EndpointReusableQueries.getById(user.resourceId),
    {
      organizations: user.organizations,
    }
  );

  const agent: IAgent = {
    agentId: user.resourceId,
    agentType: SessionAgentType.User,
  };

  const adminPreset = await setupAdminPreset(context, agent, organization);
  await assignAdminPresetToUser(context, user, organization, adminPreset);
  return {
    organization: organizationExtractor(organization),
  };
};

export default addOrganization;
