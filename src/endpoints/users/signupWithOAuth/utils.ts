import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {User} from '../../../definitions/user.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getNewIdForResource, newResource} from '../../../utils/resource.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {SignupWithOAuthEndpointParams} from './types.js';

export const INTERNAL_signupUserWithOAuth = async (params: {
  data: SignupWithOAuthEndpointParams;
  otherParams?: Partial<User>;
  opts: SemanticProviderMutationParams;
}) => {
  const {data, otherParams, opts} = params;
  let user = await kIjxSemantic.user().getByEmail(data.email, opts);

  if (user) {
    const updates: Partial<User> = {
      ...otherParams,
      oauthUserId: data.oauthUserId,
      lastUpdatedAt: getTimestamp(),
    };

    if (data.emailVerifiedAt && !user.isEmailVerified) {
      updates.isEmailVerified = true;
      updates.emailVerifiedAt = data.emailVerifiedAt;
    }

    await kIjxSemantic.user().updateOneById(user.resourceId, updates, opts);
    user = {...user, ...updates};
  } else {
    const now = getTimestamp();
    const [firstName, lastName] = data.name.split(' ');
    user = newResource<User>(kFimidaraResourceType.User, {
      hash: '',
      resourceId: getNewIdForResource(kFimidaraResourceType.User),
      email: data.email,
      firstName,
      lastName,
      createdAt: now,
      lastUpdatedAt: now,
      isOnWaitlist: kIjxUtils.suppliedConfig().FLAG_waitlistNewSignups || false,
      oauthUserId: data.oauthUserId,
      emailVerifiedAt: data.emailVerifiedAt,
      isEmailVerified: !!data.emailVerifiedAt,
      ...otherParams,
    });

    await kIjxSemantic.user().insertItem(user, opts);
  }

  return await populateUserWorkspaces(user, opts);
};
