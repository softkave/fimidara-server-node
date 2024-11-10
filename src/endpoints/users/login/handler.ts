import * as argon2 from 'argon2';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {User} from '../../../definitions/user.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {InvalidEmailOrPasswordError} from '../errors.js';
import {LoginEndpoint} from './types.js';
import {getLoginResult} from './utils.js';
import {loginJoiSchema} from './validation.js';

const loginEndpoint: LoginEndpoint = async reqData => {
  const data = validate(reqData.data, loginJoiSchema);
  const {workspaceId} = await initEndpoint(reqData);

  let user: User | null = null;
  if (data.email) {
    user = await kSemanticModels.user().getByEmail({
      workspaceId,
      email: data.email,
    });
  } else if (data.userId) {
    user = await kSemanticModels.user().getByUserId({
      workspaceId,
      userId: data.userId,
    });
  }

  appAssert(user, new InvalidEmailOrPasswordError());
  const passwordMatch = await argon2.verify(user.hash, data.password);
  appAssert(passwordMatch, new InvalidEmailOrPasswordError());

  return await getLoginResult(user);
};

export default loginEndpoint;
