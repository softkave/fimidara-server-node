import {EmailAddressVerifiedError} from '../errors';
import {ConfirmEmailAddressEndpoint} from './types';
import {getDateString} from '../../../utilities/dateFns';
import {fireAndForgetPromise} from '../../../utilities/promiseFns';
import {TokenAudience} from '../../contexts/SessionContext';
import UserQueries from '../UserQueries';
import UserTokenQueries from '../UserTokenQueries';
import {
  getUserClientAssignedToken,
  getUserToken,
  toLoginResult,
} from '../login/utils';
import {withUserOrganizations} from '../../assignedItems/getAssignedItems';

const confirmEmailAddress: ConfirmEmailAddressEndpoint = async (
  context,
  instData
) => {
  let user = await context.session.getUser(context, instData, [
    TokenAudience.ConfirmEmailAddress,
  ]);

  if (user.isEmailVerified) {
    throw new EmailAddressVerifiedError();
  }

  user = await withUserOrganizations(
    context,
    await context.data.user.assertUpdateItem(
      UserQueries.getById(user.resourceId),
      {
        isEmailVerified: true,
        emailVerifiedAt: getDateString(),
      }
    )
  );

  // Delete the token used for this request cause it's no longer needed
  // Fire and forget cause it's not needed that the call succeeds
  fireAndForgetPromise(
    context.data.userToken.deleteItem(
      // It's okay to disable this check because incomingTokenData
      // exists cause it's checked already in session.getUser
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      UserTokenQueries.getById(instData.incomingTokenData!.sub.id)
    )
  );

  const userToken = await getUserToken(context, user);
  const clientAssignedToken = await getUserClientAssignedToken(
    context,
    user.resourceId
  );

  return toLoginResult(context, user, userToken, clientAssignedToken);
};

export default confirmEmailAddress;
