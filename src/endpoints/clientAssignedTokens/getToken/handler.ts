import {validate} from '../../../utilities/validate';
import ClientAssignedTokenQueries from '../queries';
import {ClientAssignedTokenUtils} from '../utils';
import {GetClientAssignedTokenEndpoint} from './types';
import {getClientAssignedTokenJoiSchema} from './validation';

const getClientAssignedToken: GetClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getClientAssignedTokenJoiSchema);
  const user = await context.session.getUser(context, instData);
  const token = await context.data.clientAssignedToken.assertGetItem(
    ClientAssignedTokenQueries.getById(data.tokenId)
  );

  return {
    token: ClientAssignedTokenUtils.extractPublicToken(token),
  };
};

export default getClientAssignedToken;
