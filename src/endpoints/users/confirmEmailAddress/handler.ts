import {AppResourceType, TokenAccessScope} from '../../../definitions/system';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from '../login/utils';
import internalConfirmEmailAddress from './internalConfirmEmailAddress';
import {ConfirmEmailAddressEndpoint} from './types';

const confirmEmailAddress: ConfirmEmailAddressEndpoint = async (context, instData) => {
  const agent = await context.session.getAgent(
    context,
    instData,
    AppResourceType.User,
    TokenAccessScope.ConfirmEmailAddress
  );
  const user = await internalConfirmEmailAddress(context, agent.agentId, agent.user);
  const [userToken, clientAssignedToken] = await executeWithMutationRunOptions(context, opts =>
    Promise.all([
      getUserToken(context, agent.agentId, opts),
      getUserClientAssignedToken(context, agent.agentId, opts),
    ])
  );
  const userWithWorkspaces = await populateUserWorkspaces(context, user);
  return toLoginResult(context, userWithWorkspaces, userToken, clientAssignedToken);
};

export default confirmEmailAddress;