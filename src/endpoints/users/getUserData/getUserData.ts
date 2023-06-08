import {AppResourceType} from '../../../definitions/system';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from '../login/utils';
import {assertUser} from '../utils';
import {GetUserDataEndpoint} from './types';

const getUserData: GetUserDataEndpoint = async (context, instData) => {
  const agent = await context.session.getAgent(context, instData, AppResourceType.User);
  const [userToken, clientAssignedToken] = await executeWithMutationRunOptions(context, opts =>
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
