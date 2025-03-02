import * as argon2 from 'argon2';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import RequestData from '../../RequestData.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {getLoginResult} from '../login/utils.js';
import {assertUser} from '../utils.js';

export async function INTERNAL_changePassword(
  reqData: Pick<RequestData, 'agent' | 'incomingTokenData'>,
  userId: string,
  props: {password: string}
) {
  const hash = await argon2.hash(props.password);
  const updatedUser = await kIjxSemantic.utils().withTxn(async opts => {
    const updatedUser = await kIjxSemantic.user().getAndUpdateOneById(
      userId,
      {
        hash,
        passwordLastChangedAt: getTimestamp(),
        requiresPasswordChange: false,
      },
      opts
    );
    assertUser(updatedUser);

    // soft delete existing user tokens cause they're no longer valid
    await kIjxSemantic
      .agentToken()
      .softDeleteAgentTokens(updatedUser.resourceId, undefined, opts);
    return updatedUser;
  });

  // Delete user token and incomingTokenData since they are no longer valid
  reqData.agent = null;
  reqData.incomingTokenData = null;
  const completeUserData = await populateUserWorkspaces(updatedUser);

  return await getLoginResult(completeUserData);
}
