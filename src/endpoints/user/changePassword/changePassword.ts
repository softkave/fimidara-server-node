import * as argon2 from 'argon2';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {fireAndForgetPromise} from '../../../utilities/promiseFns';
import {validate} from '../../../utilities/validate';
import {
  CURRENT_USER_TOKEN_VERSION,
  JWTEndpoint,
} from '../../contexts/UserTokenContext';
import {userExtractor} from '../utils';
import {ChangePasswordEndpoint} from './types';
import {changePasswordJoiSchema} from './validation';

const changePassword: ChangePasswordEndpoint = async (context, instData) => {
  const result = validate(instData.data, changePasswordJoiSchema);
  const newPassword = result.password;
  let user = await context.session.getUser(context, instData);
  const hash = await argon2.hash(newPassword);
  user = await context.user.assertUpdateUserById(context, user.userId, {
    hash,
    passwordLastChangedAt: getDateString(),
  });

  instData.user = user;
  delete instData.userToken;
  delete instData.incomingTokenData;

  fireAndForgetPromise(
    context.userToken.deleteTokensByUserId(context, user.userId)
  );

  const tokenData = await context.userToken.saveToken(context, {
    tokenId: getNewId(),
    audience: [JWTEndpoint.Login],
    issuedAt: getDateString(),
    userId: user.userId,
    version: CURRENT_USER_TOKEN_VERSION,
  });

  instData.userToken = tokenData;
  const encodedToken = context.userToken.encodeToken(
    context,
    tokenData.tokenId,
    tokenData.expires
  );

  return {
    token: encodedToken,
    user: userExtractor(user),
  };
};

export default changePassword;
