import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {User} from '../../../definitions/user.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {InvalidEmailOrPasswordError} from '../errors.js';
import {getLoginResult} from '../login/utils.js';
import {LoginWithOAuthEndpoint} from './types.js';
import {loginWithOAuthJoiSchema} from './validation.js';

const loginWithOAuth: LoginWithOAuthEndpoint = async reqData => {
  const data = validate(reqData.data, loginWithOAuthJoiSchema);
  let user = await kSemanticModels.user().getByOAuthUserId(data.oauthUserId);
  appAssert(user, new InvalidEmailOrPasswordError());

  if (data.emailVerifiedAt && !user.isEmailVerified) {
    await kSemanticModels.utils().withTxn(async txn => {
      appAssert(user);
      const updates: Partial<User> = {
        isEmailVerified: true,
        emailVerifiedAt: data.emailVerifiedAt,
      };

      await kSemanticModels.user().updateOneById(user.resourceId, updates, txn);
      user = {...user, ...updates};
    });
  }

  return await getLoginResult(user);
};

export default loginWithOAuth;
