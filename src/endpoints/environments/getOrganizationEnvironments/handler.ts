import {validate} from '../../../utilities/validate';
import {environmentListExtractor} from '../utils';
import {GetOrganizationEnvironmentsEndpoint} from './types';
import {getOrganizationEnvironmentsJoiSchema} from './validation';

const getOrganizationEnvironments: GetOrganizationEnvironmentsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getOrganizationEnvironmentsJoiSchema);
  const user = await context.session.getUser(context, instData);
  const environments = await context.environment.getEnvironmentsByOrganizationId(
    context,
    data.organizationId
  );

  return {
    environments: environmentListExtractor(environments),
  };
};

export default getOrganizationEnvironments;
