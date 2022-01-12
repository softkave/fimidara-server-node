import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {EnvironmentUtils} from '../utils';
import {AddEnvironmentEndpoint} from './types';
import {addEnvironmentJoiSchema} from './validation';

const addEnvironment: AddEnvironmentEndpoint = async (context, instData) => {
  const data = validate(instData.data, addEnvironmentJoiSchema);
  const user = await context.session.getUser(context, instData);
  const environment = await context.data.environment.saveItem({
    createdAt: getDateString(),
    createdBy: user.resourceId,
    name: data.environment.name,
    environmentId: getNewId(),
    description: data.environment.description,
    organizationId: data.environment.organizationId,
  });

  return {
    environment: EnvironmentUtils.getPublicEnvironment(environment),
  };
};

export default addEnvironment;
