import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {kTokenAccessScope} from '../../../definitions/system.js';
import {User} from '../../../definitions/user.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {assertUser} from '../utils.js';

/**
 * Confirms the email address of the user. For internal use only.
 */
export default async function INTERNAL_confirmEmailAddress(
  userId: string,
  user: User | null
) {
  return await kIjxSemantic.utils().withTxn(async opts => {
    [user] = await Promise.all([
      kIjxSemantic
        .user()
        .getAndUpdateOneById(
          userId,
          {isEmailVerified: true, emailVerifiedAt: getTimestamp()},
          opts
        ),
      kIjxSemantic
        .agentToken()
        .softDeleteAgentTokens(
          userId,
          kTokenAccessScope.confirmEmailAddress,
          opts
        ),
    ]);

    assertUser(user);
    return user;
  });
}
