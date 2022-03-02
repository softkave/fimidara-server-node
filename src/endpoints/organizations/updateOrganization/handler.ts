import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {OrganizationExistsError} from '../errors';
import OrganizationQueries from '../queries';
import {
  checkOrganizationAuthorization02,
  organizationExtractor,
} from '../utils';
import {UpdateOrganizationEndpoint} from './types';
import {updateOrganizationJoiSchema} from './validation';

/**
 * updateOrganization. Ensure that:
 * - Auth check
 * - Update and return organization data
 */

const updateOrganization: UpdateOrganizationEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateOrganizationJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {organization} = await checkOrganizationAuthorization02(
    context,
    agent,
    data.organizationId,
    BasicCRUDActions.Update
  );

  if (data.organization.name) {
    const organizationExists = await context.data.organization.checkItemExists(
      OrganizationQueries.getByName(data.organization.name)
    );

    if (organizationExists) {
      throw new OrganizationExistsError();
    }
  }

  const updatedOrganization = await context.data.organization.assertUpdateItem(
    OrganizationQueries.getById(organization.resourceId),
    {
      ...data.organization,
      lastUpdatedAt: getDateString(),
      lastUpdatedBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
    }
  );

  return {organization: organizationExtractor(updatedOrganization)};
};

export default updateOrganization;
