import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {checkClientAssignedTokenAuthorization03, getPublicClientToken} from '../utils';
import {GetClientAssignedTokenEndpoint} from './types';
import {getClientAssignedTokenJoiSchema} from './validation';

const getClientAssignedToken: GetClientAssignedTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, getClientAssignedTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {token} = await checkClientAssignedTokenAuthorization03(
    context,
    agent,
    data,
    BasicCRUDActions.Read
  );
  const tokenWithAssignedItems = await populateAssignedTags(context, token.workspaceId, token);
  return {
    token: getPublicClientToken(context, tokenWithAssignedItems),
  };
};

export default getClientAssignedToken;
