import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {getLoginResult} from '../login/utils.js';
import INTERNAL_confirmEmailAddress from './internalConfirmEmailAddress.js';
import {ConfirmEmailAddressEndpoint} from './types.js';

const confirmEmailAddress: ConfirmEmailAddressEndpoint = async reqData => {
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.user,
      kSessionUtils.accessScopes.confirmEmailAddress
    );
  const user = await INTERNAL_confirmEmailAddress(
    agent.agentId,
    agent.user ?? null
  );

  return await getLoginResult(user);
};

export default confirmEmailAddress;
