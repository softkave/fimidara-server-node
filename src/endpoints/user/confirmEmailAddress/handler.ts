import {TokenAudience} from '../../../definitions/system';
import {
  getUserClientAssignedToken,
  getUserToken,
  toLoginResult,
} from '../login/utils';
import internalConfirmEmailAddress from './internalConfirmEmailAddress';
import {ConfirmEmailAddressEndpoint} from './types';

const confirmEmailAddress: ConfirmEmailAddressEndpoint = async (
  context,
  instData
) => {
  let user = await context.session.getUser(context, instData, [
    TokenAudience.ConfirmEmailAddress,
  ]);

  user = await internalConfirmEmailAddress(context, user);
  const userToken = await getUserToken(context, user);
  const clientAssignedToken = await getUserClientAssignedToken(
    context,
    user.resourceId
  );

  return toLoginResult(context, user, userToken, clientAssignedToken);
};

export default confirmEmailAddress;
