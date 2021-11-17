import {validate} from '../../../utilities/validate';
import EnvironmentQueries from '../queries';
import {DeleteEnvironmentEndpoint} from './types';
import {deleteEnvironmentJoiSchema} from './validation';

const deleteEnvironment: DeleteEnvironmentEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deleteEnvironmentJoiSchema);
  await context.session.getUser(context, instData);
  await context.data.environment.deleteItem(
    EnvironmentQueries.getById(data.environmentId)
  );

  // TODO:
  // delete environments
  // delete spaces
  // delete buckets
  // delete program access keys
  // delete client assigned keys
  // remove environments in users
  // delete files
};

export default deleteEnvironment;
