import * as argon2 from 'argon2';
import {AppResourceType} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {getTimestamp} from '../../../utils/dateFns';
import {newResource} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {MemStore} from '../../contexts/mem/Mem';
import {BaseContext} from '../../contexts/types';
import {EmailAddressNotAvailableError} from '../errors';
import {SignupEndpointParams} from './types';

export const internalSignupUser = async (context: BaseContext, data: SignupEndpointParams) => {
  const userExists = await context.semantic.user.existsByEmail(data.email);
  if (userExists) {
    throw new EmailAddressNotAvailableError();
  }

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
  });

  await MemStore.withTransaction(context, async txn => {
    await context.semantic.user.insertItem(user, {transaction: txn});
  });

  return await populateUserWorkspaces(context, user);
};