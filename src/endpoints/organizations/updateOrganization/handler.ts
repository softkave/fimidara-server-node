import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import OrganizationQueries from '../queries';
import {
  checkOrganizationAuthorization02,
  organizationExtractor,
} from '../utils';
import {UpdateOrganizationEndpoint} from './types';
import {updateOrganizationJoiSchema} from './validation';

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

  const updatedOrganization = await context.data.organization.assertUpdateItem(
    OrganizationQueries.getById(organization.organizationId),
    {
      ...data.data,
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
