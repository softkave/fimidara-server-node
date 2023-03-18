import {TokenAccessScope} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {getTimestamp} from '../../../utils/dateFns';
import {MemStore} from '../../contexts/mem/Mem';
import {ISemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {IBaseContext} from '../../contexts/types';
import {assertUser} from '../utils';

/**
 * Confirms the email address of the user. For internal use only.
 */
export default async function internalConfirmEmailAddress(
  context: IBaseContext,
  userId: string,
  user?: IUser | null
) {
  if (!user) {
    user = await context.semantic.user.getOneById(userId);
    assertUser(user);
  }
  if (user.isEmailVerified) {
    return user;
  }

  user = await MemStore.withTransaction(context, async txn => {
    const opts: ISemanticDataAccessProviderMutationRunOptions = {transaction: txn};
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
