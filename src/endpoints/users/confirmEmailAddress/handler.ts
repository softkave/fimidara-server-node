import {kAppResourceType, kTokenAccessScope} from '../../../definitions/system';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from '../login/utils';
import INTERNAL_confirmEmailAddress from './internalConfirmEmailAddress';
import {ConfirmEmailAddressEndpoint} from './types';

const confirmEmailAddress: ConfirmEmailAddressEndpoint = async instData => {
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, kAppResourceType.User, kTokenAccessScope.ConfirmEmailAddress);
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
