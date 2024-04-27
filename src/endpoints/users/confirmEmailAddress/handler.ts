import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from '../login/utils';
import INTERNAL_confirmEmailAddress from './internalConfirmEmailAddress';
import {ConfirmEmailAddressEndpoint} from './types';

const confirmEmailAddress: ConfirmEmailAddressEndpoint = async instData => {
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.user,
      kSessionUtils.accessScopes.confirmEmailAddress
    );
  const user = await INTERNAL_confirmEmailAddress(agent.agentId, agent.user ?? null);
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

  const userWithWorkspaces = await populateUserWorkspaces(user);
  return toLoginResult(userWithWorkspaces, userToken, clientAssignedToken);
};

export default confirmEmailAddress;
