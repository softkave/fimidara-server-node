import {AppResourceTypeMap} from '../../../definitions/system';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {kUtilsInjectables, kSemanticModels} from '../../contexts/injectables';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from '../login/utils';
import {assertUser} from '../utils';
import {GetUserDataEndpoint} from './types';

const getUserData: GetUserDataEndpoint = async instData => {
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, AppResourceTypeMap.User);
  const [userToken, clientAssignedToken] = await kSemanticModels
    .utils()
    .withTxn(opts =>
      Promise.all([
        getUserToken(agent.agentId, opts),
        getUserClientAssignedToken(agent.agentId, opts),
      ])
    );
  const user = agent.user;
  assertUser(user);
  const userWithWorkspaces = await populateUserWorkspaces(user);
  return toLoginResult(userWithWorkspaces, userToken, clientAssignedToken);
};

export default getUserData;
