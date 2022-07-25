import {IUserWithWorkspace} from '../../../definitions/user';
import {getDateString} from '../../../utilities/dateFns';
import {fireAndForgetPromise} from '../../../utilities/promiseFns';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import {TokenAudience} from '../../contexts/SessionContext';
import UserQueries from '../UserQueries';
import UserTokenQueries from '../UserTokenQueries';

export default async function internalConfirmEmailAddress(
  context: IBaseContext,
  user: {resourceId: string; isEmailVerified: boolean}
) {
  if (user.isEmailVerified) {
    return await populateUserWorkspaces(
      context,
      await context.data.user.assertGetItem(
        UserQueries.getById(user.resourceId)
      )
    );
  }

  user = await populateUserWorkspaces(
    context,
    await context.data.user.assertUpdateItem(
      UserQueries.getById(user.resourceId),
      {
        isEmailVerified: true,
        emailVerifiedAt: getDateString(),
      }
    )
  );

  // Delete tokens used for confirming email address
  // cause they are no longer needed
  fireAndForgetPromise(
    context.data.userToken.deleteItem(
      UserTokenQueries.getByUserIdAndAudience(
        user.resourceId,
        TokenAudience.ConfirmEmailAddress
      )
    )
  );

  return user as IUserWithWorkspace;
}
