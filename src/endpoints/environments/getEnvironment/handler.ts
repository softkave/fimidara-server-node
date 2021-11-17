import {validate} from '../../../utilities/validate';
import EnvironmentQueries from '../queries';
import {environmentExtractor} from '../utils';
import {GetEnvironmentEndpoint} from './types';
import {getEnvironmentJoiSchema} from './validation';

const getEnvironment: GetEnvironmentEndpoint = async (context, instData) => {
  const data = validate(instData.data, getEnvironmentJoiSchema);
  const user = await context.session.getUser(context, instData);
  const environment = await context.data.environment.assertGetItem(
    EnvironmentQueries.getById(data.environmentId)
  );

  return {
    environment: environmentExtractor(environment),
  };
};

export default getEnvironment;
