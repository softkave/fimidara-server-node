import * as argon2 from 'argon2';
import {AppResourceType} from '../../../definitions/system';
import {getDateString} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import {EmailAddressNotAvailableError} from '../errors';
import UserQueries from '../UserQueries';
import {ISignupParams} from './types';

export const internalSignupUser = async (context: IBaseContext, data: ISignupParams) => {
  const userExists = await context.data.user.existsByQuery(UserQueries.getByEmail(data.email));

  if (userExists) {
    throw new EmailAddressNotAvailableError();
  }

  const hash = await argon2.hash(data.password);
  const now = getDateString();
  const user = await context.data.user.insertItem({
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

  return await populateUserWorkspaces(context, user);
};
