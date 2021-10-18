import {getDateString} from '../../../utilities/dateFns';
import {fireAndForgetPromise} from '../../../utilities/promiseFns';
import {validate} from '../../../utilities/validate';
import {EnvironmentDoesNotExistError} from '../errors';
import {environmentExtractor} from '../utils';
import {UpdateEnvironmentEndpoint} from './types';
import {updateEnvironmentJoiSchema} from './validation';

const updateEnvironment: UpdateEnvironmentEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateEnvironmentJoiSchema);
  const user = await context.session.getUser(context, instData);
  const environment = await context.environment.assertGetEnvironmentById(
    context,
    data.environmentId
  );

  const updatedEnvironment = await context.environment.updateEnvironmentById(
    context,
    data.environmentId,
    {
      ...data.data,
      lastUpdatedAt: getDateString(),
      lastUpdatedBy: user.userId,
    }
  );

  if (!updatedEnvironment) {
    throw new EnvironmentDoesNotExistError();
  }

  return {environment: environmentExtractor(updatedEnvironment)};
};

export default updateEnvironment;
