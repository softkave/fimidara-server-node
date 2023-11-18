import {AppResourceType} from '../../../definitions/system';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from '../login/utils';
import {assertUser} from '../utils';
import {GetUserDataEndpoint} from './types';

const getUserData: GetUserDataEndpoint = async (context, instData) => {
  const agent = await context.session.getAgent(context, instData, AppResourceType.User);
  const [userToken, clientAssignedToken] = await context.semantic.utils.withTxn(
    context,
    opts =>
      Promise.all([
        getUserToken(context, agent.agentId, opts),
        getUserClientAssignedToken(context, agent.agentId, opts),
      ])
  );
  const user = agent.user;
  assertUser(user);
  const userWithWorkspaces = await populateUserWorkspaces(context, user);
  return toLoginResult(context, userWithWorkspaces, userToken, clientAssignedToken);
};

export default getUserData;
