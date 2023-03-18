import * as argon2 from 'argon2';
import {AppResourceType} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {MemStore} from '../../contexts/mem/Mem';
import {ISemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from '../login/utils';
import {ChangePasswordEndpoint} from './types';
import {changePasswordJoiSchema} from './validation';

const changePassword: ChangePasswordEndpoint = async (context, instData) => {
  const result = validate(instData.data, changePasswordJoiSchema);
  const agent = await context.session.getAgent(context, instData, AppResourceType.User);
  const hash = await argon2.hash(result.password);
  const updatedUser = await MemStore.withTransaction(context, async txn => {
    const opts: ISemanticDataAccessProviderMutationRunOptions = {transaction: txn};
    const updatedUser = await context.semantic.user.getAndUpdateOneById(
      agent.agentId,
      {hash, passwordLastChangedAt: getTimestamp()},
      opts
    );

    // Delete existing user tokens cause they're no longer valid
    await context.semantic.agentToken.deleteAgentTokens(updatedUser.resourceId, undefined, opts);
    return updatedUser;
  });

  // Delete user token and incomingTokenData since they are no longer valid
  delete instData.agent?.agentToken;
  delete instData.incomingTokenData;
  const [completeUserData, userToken, clientAssignedToken] = await Promise.all([
    populateUserWorkspaces(context, updatedUser),
    getUserToken(context, agent.agentId),
    getUserClientAssignedToken(context, agent.agentId),
  ]);
  instData.user = completeUserData;
  return toLoginResult(context, completeUserData, userToken, clientAssignedToken);
};

export default changePassword;
