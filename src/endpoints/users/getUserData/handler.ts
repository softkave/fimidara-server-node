import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIkxUtils} from '../../../contexts/ijx/injectables.js';
import {getLoginResult} from '../login/utils.js';
import {assertUser} from '../utils.js';
import {GetUserDataEndpoint} from './types.js';

const getUserData: GetUserDataEndpoint = async reqData => {
  const agent = await kIkxUtils
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
