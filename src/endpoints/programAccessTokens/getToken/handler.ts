import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {getProgramAccessTokenId} from '../../contexts/SessionContext';
import {
  checkProgramAccessTokenAuthorization02,
  getPublicProgramToken,
} from '../utils';
import {GetProgramAccessTokenEndpoint} from './types';
import {getProgramAccessTokenJoiSchema} from './validation';

/**
 * getProgramAccessToken.
 * Returns the referenced program access token if the calling agent has read access to it.
 *
 * Ensure that:
 * - Auth check and permission check
 * - Return referenced token
 */

const getProgramAccessToken: GetProgramAccessTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const tokenId = getProgramAccessTokenId(
    agent,
    data.tokenId,
    data.onReferenced
  );

  const {token} = await checkProgramAccessTokenAuthorization02(
    context,
    agent,
    tokenId,
    BasicCRUDActions.Read
  );

  return {
    token: getPublicProgramToken(context, token),
  };
};

export default getProgramAccessToken;
