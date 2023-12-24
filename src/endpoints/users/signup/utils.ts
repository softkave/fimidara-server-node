import * as argon2 from 'argon2';
import {kAppResourceType} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource, newResource} from '../../../utils/resource';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {SemanticProviderMutationRunOptions} from '../../contexts/semantic/types';
import {assertEmailAddressAvailable} from '../utils';
import {SignupEndpointParams} from './types';

export const INTERNAL_signupUser = async (
  data: SignupEndpointParams,
  otherParams: Partial<User> = {},
  opts: SemanticProviderMutationRunOptions
) => {
  await assertEmailAddressAvailable(data.email, opts);

  const hash = await argon2.hash(data.password);
  const now = getTimestamp();
  const user: User = newResource(kAppResourceType.User, {
    hash,
    resourceId: getNewIdForResource(kAppResourceType.User),
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    createdAt: now,
    passwordLastChangedAt: now,
    isEmailVerified: false,
    lastUpdatedAt: now,
    isOnWaitlist: kUtilsInjectables.config().FLAG_waitlistNewSignups,
    ...otherParams,
  });
  await kSemanticModels.user().insertItem(user, opts);
  return await populateUserWorkspaces(user, opts);
};
