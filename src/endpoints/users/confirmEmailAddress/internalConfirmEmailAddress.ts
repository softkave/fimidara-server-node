import {TokenAccessScope} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {getTimestamp} from '../../../utils/dateFns';
import {MemStore} from '../../contexts/mem/Mem';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';
import {assertUser} from '../utils';

/**
 * Confirms the email address of the user. For internal use only.
 */
export default async function internalConfirmEmailAddress(
  context: BaseContextType,
  userId: string,
  user?: User | null
) {
  if (!user) {
    user = await context.semantic.user.getOneById(userId);
    assertUser(user);
  }
  if (user.isEmailVerified) {
    return user;
  }

  user = await MemStore.withTransaction(context, async txn => {
    const opts: SemanticDataAccessProviderMutationRunOptions = {transaction: txn};
    const [user] = await Promise.all([
      context.semantic.user.getAndUpdateOneById(
        userId,
        {isEmailVerified: true, emailVerifiedAt: getTimestamp()},
        opts
      ),
      context.semantic.agentToken.deleteAgentTokens(
        userId,
        TokenAccessScope.ConfirmEmailAddress,
        opts
      ),
    ]);

    return user;
  });

  return user;
}
