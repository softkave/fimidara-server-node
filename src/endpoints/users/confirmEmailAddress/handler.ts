import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {getLoginResult} from '../login/utils.js';
import INTERNAL_confirmEmailAddress from './internalConfirmEmailAddress.js';
import {ConfirmEmailAddressEndpoint} from './types.js';

const confirmEmailAddress: ConfirmEmailAddressEndpoint = async reqData => {
  const agent = await kIjxUtils
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
