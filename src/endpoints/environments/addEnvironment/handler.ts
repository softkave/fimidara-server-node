import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {EnvironmentExistsError} from '../errors';
import {environmentExtractor} from '../utils';
import {AddEnvironmentEndpoint} from './types';
import {addEnvironmentJoiSchema} from './validation';

const addEnvironment: AddEnvironmentEndpoint = async (context, instData) => {
  const data = validate(instData.data, addEnvironmentJoiSchema);
  const user = await context.session.getUser(context, instData);

  if (
    await context.environment.environmentExists(context, data.environment.name)
  ) {
    throw new EnvironmentExistsError();
  }

  const environment = await context.environment.saveEnvironment(context, {
    createdAt: getDateString(),
    createdBy: user.userId,
    name: data.environment.name,
    environmentId: getNewId(),
    description: data.environment.description,
    organizationId: data.environment.organizationId,
  });

  const publicData = environmentExtractor(environment);
  return {
    environment: publicData,
  };
};

export default addEnvironment;
