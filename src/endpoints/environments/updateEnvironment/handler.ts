import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import EnvironmentQueries from '../queries';
import {environmentExtractor} from '../utils';
import {UpdateEnvironmentEndpoint} from './types';
import {updateEnvironmentJoiSchema} from './validation';

const updateEnvironment: UpdateEnvironmentEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateEnvironmentJoiSchema);
  const user = await context.session.getUser(context, instData);
  const updatedEnvironment = await context.data.environment.assertUpdateItem(
    EnvironmentQueries.getById(data.environmentId),
    {
      ...data.data,
      lastUpdatedAt: getDateString(),
      lastUpdatedBy: user.userId,
    }
  );

  return {environment: environmentExtractor(updatedEnvironment)};
};

export default updateEnvironment;
