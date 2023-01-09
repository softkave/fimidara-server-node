import {TokenAudience} from '../../../definitions/system';
import {IUserWithWorkspace} from '../../../definitions/user';
import {getDateString} from '../../../utils/dateFns';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {} from '../../contexts/SessionContext';
import {IBaseContext} from '../../contexts/types';
import UserQueries from '../UserQueries';
import UserTokenQueries from '../UserTokenQueries';

/**
 * Confirms the email address of the user. For internal use only.
 * @param context
 * @param user
 * @returns
 */
export default async function internalConfirmEmailAddress(
  context: IBaseContext,
  user: {resourceId: string; isEmailVerified: boolean}
) {
  if (user.isEmailVerified) {
    return await populateUserWorkspaces(
      context,
      await context.data.user.assertGetOneByQuery(UserQueries.getById(user.resourceId))
    );
  }

  user = await populateUserWorkspaces(
    context,
    await context.data.user.assertGetAndUpdateOneByQuery(UserQueries.getById(user.resourceId), {
      isEmailVerified: true,
      emailVerifiedAt: getDateString(),
    })
  );

  // Delete tokens used for confirming email address
  // cause they are no longer needed
  await context.data.userToken.deleteOneByQuery(
    UserTokenQueries.getByUserIdAndAudience(user.resourceId, TokenAudience.ConfirmEmailAddress)
  );

  return user as IUserWithWorkspace;
}
