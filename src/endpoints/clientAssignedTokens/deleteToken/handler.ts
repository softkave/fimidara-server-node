import {validate} from '../../../utilities/validate';
import ClientAssignedTokenQueries from '../queries';
import {DeleteClientAssignedTokenEndpoint} from './types';
import {deleteClientAssignedTokenJoiSchema} from './validation';

const deleteClientAssignedToken: DeleteClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deleteClientAssignedTokenJoiSchema);
  await context.session.getUser(context, instData);
  await context.data.clientAssignedToken.deleteItem(
    ClientAssignedTokenQueries.getById(data.tokenId)
  );
};

export default deleteClientAssignedToken;
