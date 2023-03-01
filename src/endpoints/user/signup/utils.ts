import * as argon2 from 'argon2';
import {AppResourceType, SYSTEM_SESSION_AGENT} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {getTimestamp} from '../../../utils/dateFns';
import {newResource} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import {EmailAddressNotAvailableError} from '../errors';
import {ISignupEndpointParams} from './types';

export const internalSignupUser = async (context: IBaseContext, data: ISignupEndpointParams) => {
  const userExists = await context.semantic.user.existsByEmail(data.email);
  if (userExists) {
    throw new EmailAddressNotAvailableError();
  }

  const hash = await argon2.hash(data.password);
  const now = getTimestamp();
  const user: IUser = newResource(SYSTEM_SESSION_AGENT, AppResourceType.User, {
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
  await context.semantic.user.insertItem(user);
  return await populateUserWorkspaces(context, user);
};
