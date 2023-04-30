import * as argon2 from 'argon2';
import {AppResourceType} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource, newResource} from '../../../utils/resource';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {MemStore} from '../../contexts/mem/Mem';
import {BaseContextType} from '../../contexts/types';
import {assertEmailAddressAvailable} from '../utils';
import {SignupEndpointParams} from './types';

export const INTERNAL_signupUser = async (
  context: BaseContextType,
  data: SignupEndpointParams,
  otherParams: Partial<User> = {}
) => {
  await assertEmailAddressAvailable(context, data.email);

  const hash = await argon2.hash(data.password);
  const now = getTimestamp();
  const user: User = newResource(AppResourceType.User, {
    hash,
    resourceId: getNewIdForResource(AppResourceType.User),
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    createdAt: now,
    passwordLastChangedAt: now,
    isEmailVerified: false,
    lastUpdatedAt: now,
    isOnWaitlist: context.appVariables.FLAG_waitlistNewSignups,
    ...otherParams,
  });

  await MemStore.withTransaction(context, async txn => {
    await context.semantic.user.insertItem(user, {transaction: txn});
  });

  return await populateUserWorkspaces(context, user);
};
