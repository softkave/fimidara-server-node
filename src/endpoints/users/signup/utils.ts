import * as argon2 from 'argon2';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {User} from '../../../definitions/user.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getNewIdForResource, newResource} from '../../../utils/resource.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {assertEmailAddressAvailable} from '../utils.js';
import {SignupEndpointParams} from './types.js';

export const INTERNAL_signupUser = async (
  data: SignupEndpointParams,
  otherParams: Partial<User> = {},
  opts: SemanticProviderMutationParams
) => {
  await assertEmailAddressAvailable(data.email, opts);

  const hash = await argon2.hash(data.password);
  const now = getTimestamp();
  const user: User = newResource(kFimidaraResourceType.User, {
    hash,
    resourceId: getNewIdForResource(kFimidaraResourceType.User),
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    createdAt: now,
    passwordLastChangedAt: now,
    isEmailVerified: false,
    lastUpdatedAt: now,
    isOnWaitlist: kIjxUtils.suppliedConfig().FLAG_waitlistNewSignups || false,
    ...otherParams,
  });
  await kIjxSemantic.user().insertItem(user, opts);
  return await populateUserWorkspaces(user, opts);
};
