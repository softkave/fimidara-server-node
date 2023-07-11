import {TokenAccessScope} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {getTimestamp} from '../../../utils/dateFns';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';
import {assertUser} from '../utils';

/**
 * Confirms the email address of the user. For internal use only.
 */
export default async function INTERNAL_confirmEmailAddress(
  context: BaseContextType,
  userId: string,
  user: User | null,
  opts?: SemanticDataAccessProviderMutationRunOptions
) {
  return await context.semantic.utils.withTxn(
    context,
    async opts => {
      [user] = await Promise.all([
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

      assertUser(user);
      return user;
    },
    opts
  );
}
