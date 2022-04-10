import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {withAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';
import {
  checkClientAssignedTokenAuthorization03,
  getPublicClientToken,
} from '../utils';
import {GetClientAssignedTokenEndpoint} from './types';
import {getClientAssignedTokenJoiSchema} from './validation';

const getClientAssignedToken: GetClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getClientAssignedTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  let {token} = await checkClientAssignedTokenAuthorization03(
    context,
    agent,
    data,
    BasicCRUDActions.Read
  );

  token = await withAssignedPresetsAndTags(
    context,
    token.organizationId,
    token,
    AppResourceType.ClientAssignedToken
  );

  return {
    token: getPublicClientToken(context, token),
  };
};

export default getClientAssignedToken;
