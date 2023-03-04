import {AppResourceType, TokenAccessScope} from '../../../definitions/system';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from '../login/utils';
import internalConfirmEmailAddress from './internalConfirmEmailAddress';
import {ConfirmEmailAddressEndpoint} from './types';

const confirmEmailAddress: ConfirmEmailAddressEndpoint = async (context, instData) => {
  const agent = await context.session.getAgent(
    context,
    instData,
    AppResourceType.User,
    TokenAccessScope.ConfirmEmailAddress
  );
  const [user, userToken, clientAssignedToken] = await Promise.all([
    internalConfirmEmailAddress(context, agent.agentId, agent.user),
    getUserToken(context, agent),
    getUserClientAssignedToken(context, agent),
  ]);
  const userWithWorkspaces = await populateUserWorkspaces(context, user);
  return toLoginResult(context, userWithWorkspaces, userToken, clientAssignedToken);
};

export default confirmEmailAddress;
