import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from '../login/utils.js';
import {assertUser} from '../utils.js';
import {GetUserDataEndpoint} from './types.js';

const getUserData: GetUserDataEndpoint = async instData => {
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.user,
      kSessionUtils.accessScopes.user
    );
  const [userToken, clientAssignedToken] = await kSemanticModels
    .utils()
    .withTxn(
      opts =>
        Promise.all([
          getUserToken(agent.agentId, opts),
          getUserClientAssignedToken(agent.agentId, opts),
        ]),
      /** reuseTxn */ false
    );

  const user = agent.user;
  assertUser(user);
  const userWithWorkspaces = await populateUserWorkspaces(user);
  return toLoginResult(userWithWorkspaces, userToken, clientAssignedToken);
};

export default getUserData;
