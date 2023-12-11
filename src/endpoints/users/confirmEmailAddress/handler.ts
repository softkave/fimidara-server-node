import {AppResourceTypeMap, TokenAccessScopeMap} from '../../../definitions/system';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {kUtilsInjectables, kSemanticModels} from '../../contexts/injectables';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from '../login/utils';
import INTERNAL_confirmEmailAddress from './internalConfirmEmailAddress';
import {ConfirmEmailAddressEndpoint} from './types';

const confirmEmailAddress: ConfirmEmailAddressEndpoint = async instData => {
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, AppResourceTypeMap.User, TokenAccessScopeMap.ConfirmEmailAddress);
  const user = await INTERNAL_confirmEmailAddress(agent.agentId, agent.user ?? null);
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
