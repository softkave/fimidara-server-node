import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {getClientAssignedTokenId} from '../../contexts/SessionContext';
import {
  checkClientAssignedTokenAuthorization02,
  ClientAssignedTokenUtils,
} from '../utils';
import {GetClientAssignedTokenEndpoint} from './types';
import {getClientAssignedTokenJoiSchema} from './validation';

const getClientAssignedToken: GetClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getClientAssignedTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const tokenId = getClientAssignedTokenId(
    agent,
    data.onReferenced && data.tokenId
  );

  const {token} = await checkClientAssignedTokenAuthorization02(
    context,
    agent,
    tokenId,
    BasicCRUDActions.Read
  );

  return {
    token: ClientAssignedTokenUtils.extractPublicToken(token),
  };
};

export default getClientAssignedToken;
