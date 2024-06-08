import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {
  getUserClientAssignedToken,
  getUserToken,
  toLoginResult,
} from '../login/utils.js';
import INTERNAL_confirmEmailAddress from './internalConfirmEmailAddress.js';
import {ConfirmEmailAddressEndpoint} from './types.js';

const confirmEmailAddress: ConfirmEmailAddressEndpoint = async instData => {
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.user,
      kSessionUtils.accessScopes.confirmEmailAddress
    );
  const user = await INTERNAL_confirmEmailAddress(
    agent.agentId,
    agent.user ?? null
  );
  const [userToken, clientAssignedToken] = await kSemanticModels
    .utils()
    .withTxn(opts =>
      Promise.all([
        getUserToken(agent.agentId, opts),
        getUserClientAssignedToken(agent.agentId, opts),
      ])
    );

  const userWithWorkspaces = await populateUserWorkspaces(user);
  return toLoginResult(userWithWorkspaces, userToken, clientAssignedToken);
};

export default confirmEmailAddress;
