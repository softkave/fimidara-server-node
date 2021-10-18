import {validate} from '../../../utilities/validate';
import {environmentExtractor} from '../utils';
import {GetEnvironmentEndpoint} from './types';
import {getEnvironmentJoiSchema} from './validation';

const getEnvironment: GetEnvironmentEndpoint = async (context, instData) => {
  const data = validate(instData.data, getEnvironmentJoiSchema);
  const user = await context.session.getUser(context, instData);
  const environment = await context.environment.assertGetEnvironmentById(
    context,
    data.environmentId
  );

  return {
    environment: environmentExtractor(environment),
  };
};

export default getEnvironment;
