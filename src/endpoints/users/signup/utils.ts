import * as argon2 from 'argon2';
import {AppResourceType} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {getTimestamp} from '../../../utils/dateFns';
import {getNewIdForResource, newResource} from '../../../utils/resource';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';
import {assertEmailAddressAvailable} from '../utils';
import {SignupEndpointParams} from './types';

export const INTERNAL_signupUser = async (
  context: BaseContextType,
  data: SignupEndpointParams,
  otherParams: Partial<User> = {},
  opts?: SemanticDataAccessProviderMutationRunOptions
) => {
  return await context.semantic.utils.withTxn(
    context,
    async opts => {
      await assertEmailAddressAvailable(context, data.email, opts);

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
      await context.semantic.user.insertItem(user, opts);
      return await populateUserWorkspaces(context, user);
    },
    opts
  );
};
