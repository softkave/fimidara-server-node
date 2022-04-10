import {IAgent, SessionAgentType} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {organizationExtractor} from '../utils';
import internalCreateOrg from './internalCreateOrg';
import {AddOrganizationEndpoint} from './types';
import {addOrganizationJoiSchema} from './validation';

const addOrganization: AddOrganizationEndpoint = async (context, instData) => {
  const data = validate(instData.data, addOrganizationJoiSchema);
  const user = await context.session.getUser(context, instData);
  const agent: IAgent = {
    agentId: user.resourceId,
    agentType: SessionAgentType.User,
  };

  const {organization} = await internalCreateOrg(context, data, agent, user);
  return {
    organization: organizationExtractor(organization),
  };
};

export default addOrganization;
