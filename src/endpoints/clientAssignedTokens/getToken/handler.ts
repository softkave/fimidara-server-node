import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkClientAssignedTokenAuthorization03,
  ClientAssignedTokenUtils,
} from '../utils';
import {GetClientAssignedTokenEndpoint} from './types';
import {getClientAssignedTokenJoiSchema} from './validation';

/**
 * getClientAssignedToken.
 * Returns a the client assigned token referenced by the provided ID.
 *
 * Ensure that:
 * - Auth check
 * - Return the client assigned token
 */

const getClientAssignedToken: GetClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getClientAssignedTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {token} = await checkClientAssignedTokenAuthorization03(
    context,
    agent,
    data,
    BasicCRUDActions.Read
  );

  return {
    token: ClientAssignedTokenUtils.extractPublicToken(token),
  };
};

export default getClientAssignedToken;
