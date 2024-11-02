import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../definitions/system.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getLoginResult} from '../login/utils.js';
import {assertUser} from '../utils.js';
import {ConfirmEmailAddressEndpoint} from './types.js';

export async function confirmEmailAddress(userId: string) {
  return await kSemanticModels.utils().withTxn(async opts => {
    const [user] = await Promise.all([
      kSemanticModels.user().getAndUpdateOneById(
        userId,
        /** update */ {
          isEmailVerified: true,
          emailVerifiedAt: getTimestamp(),
        },
        opts
      ),
      kSemanticModels
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

const confirmEmailAddressEndpoint: ConfirmEmailAddressEndpoint =
  async reqData => {
    const {agent} = await initEndpoint(reqData, {
      tokenScope: kTokenAccessScope.confirmEmailAddress,
      permittedAgentType: kFimidaraResourceType.User,
    });

    const userId = agent.agentId;
    const user = await confirmEmailAddress(userId);

    return await getLoginResult(user);
  };

export default confirmEmailAddressEndpoint;
