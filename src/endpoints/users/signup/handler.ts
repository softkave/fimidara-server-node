import argon2 from 'argon2';
import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {User} from '../../../definitions/user.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getNewIdForResource, newResource} from '../../../utils/resource.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getLoginResult} from '../login/utils.js';
import {checkEmailAddressAvailability} from '../utils.js';
import {SignupEndpoint} from './types.js';
import {signupJoiSchema} from './validation.js';

const signupEndpoint: SignupEndpoint = async reqData => {
  const data = validate(reqData.data, signupJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData);

  const user = await kSemanticModels.utils().withTxn(async opts => {
    await checkAuthorizationWithAgent({
      agent,
      opts,
      workspaceId,
      target: {
        action: kFimidaraPermissionActions.signup,
        targetId: workspaceId,
      },
    });

    await checkEmailAddressAvailability(
      /** params */ {workspaceId, email: data.email},
      opts
    );

    const hash = await argon2.hash(data.password);
    const now = getTimestamp();
    const user: User = newResource(kFimidaraResourceType.User, {
      hash,
      workspaceId,
      resourceId: getNewIdForResource(kFimidaraResourceType.User),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      createdAt: now,
      passwordLastChangedAt: now,
      isEmailVerified: false,
      lastUpdatedAt: now,
    });

    await kSemanticModels.user().insertItem(user, opts);
    return user;
  });

  return await getLoginResult(user);
};

export default signupEndpoint;
