import * as argon2 from 'argon2';
import {getTimestamp} from '../../../utils/dateFns';
import RequestData from '../../RequestData';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {MemStore} from '../../contexts/mem/Mem';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {BaseContextType} from '../../contexts/types';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from '../login/utils';

export async function INTERNAL_changePassword(
  context: BaseContextType,
  reqData: RequestData,
  userId: string,
  props: {password: string}
) {
  const hash = await argon2.hash(props.password);
  const updatedUser = await MemStore.withTransaction(context, async txn => {
    const opts: SemanticDataAccessProviderMutationRunOptions = {transaction: txn};
    const updatedUser = await context.semantic.user.getAndUpdateOneById(
      userId,
      {hash, passwordLastChangedAt: getTimestamp(), requiresPasswordChange: false},
      opts
    );

    // Delete existing user tokens cause they're no longer valid
    await context.semantic.agentToken.deleteAgentTokens(updatedUser.resourceId, undefined, opts);
    return updatedUser;
  });

  // Delete user token and incomingTokenData since they are no longer valid
  delete reqData.agent?.agentToken;
  delete reqData.incomingTokenData;
  const completeUserData = await populateUserWorkspaces(context, updatedUser);
  const [userToken, clientAssignedToken] = await executeWithMutationRunOptions(context, opts =>
    Promise.all([
      getUserToken(context, userId, opts),
      getUserClientAssignedToken(context, userId, opts),
    ])
  );
  return toLoginResult(context, completeUserData, userToken, clientAssignedToken);
}
