import {TokenAccessScopeMap} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {getTimestamp} from '../../../utils/dateFns';
import {kSemanticModels} from '../../contexts/injectables';
import {assertUser} from '../utils';

/**
 * Confirms the email address of the user. For internal use only.
 */
export default async function INTERNAL_confirmEmailAddress(
  userId: string,
  user: User | null
) {
  return await kSemanticModels.utils().withTxn(async opts => {
    [user] = await Promise.all([
      kSemanticModels
        .user()
        .getAndUpdateOneById(
          userId,
          {isEmailVerified: true, emailVerifiedAt: getTimestamp()},
          opts
        ),
      kSemanticModels
        .agentToken()
        .deleteAgentTokens(userId, TokenAccessScopeMap.ConfirmEmailAddress, opts),
    ]);

    assertUser(user);
    return user;
  });
}
