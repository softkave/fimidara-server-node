import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {getLoginResult} from '../login/utils.js';
import {assertUser} from '../utils.js';
import {GetUserDataEndpoint} from './types.js';

const getUserData: GetUserDataEndpoint = async reqData => {
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.user,
      kSessionUtils.accessScopes.user
    );

  assertUser(agent.user);
  return await getLoginResult(agent.user);
};

export default getUserData;
