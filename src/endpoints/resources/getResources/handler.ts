import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {getOrganizationId} from '../../contexts/SessionContext';
import {checkOrganizationExists} from '../../organizations/utils';
import {getPublicResourceList} from '../getPublicResource';
import {getResources as fetchResources} from '../getResources';
import {GetResourcesEndpoint} from './types';
import {getResourcesJoiSchema} from './validation';

const getResources: GetResourcesEndpoint = async (context, instData) => {
  const data = validate(instData.data, getResourcesJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organizationId = getOrganizationId(agent, data.organizationId);
  const organization = await checkOrganizationExists(context, organizationId);
  const resources = await fetchResources({
    context,
    agent,
    organization,
    inputResources: data.resources,
    checkAuth: true,
    action: BasicCRUDActions.Read,
    nothrowOnCheckError: true,
  });

  return {
    resources: getPublicResourceList(resources, organizationId),
  };
};

export default getResources;
