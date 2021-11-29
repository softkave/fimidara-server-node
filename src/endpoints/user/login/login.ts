import * as argon2 from 'argon2';
import {getDateString} from '../../../utilities/dateFns';
import {ServerError} from '../../../utilities/errors';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
  CURRENT_TOKEN_VERSION,
  TokenAudience,
  TokenType,
} from '../../contexts/SessionContext';
import {InvalidEmailOrPasswordError} from '../errors';
import UserQueries from '../UserQueries';
import UserTokenQueries from '../UserTokenQueries';
import {userExtractor} from '../utils';
import {LoginEndpoint} from './types';
import {loginJoiSchema} from './validation';

const login: LoginEndpoint = async (context, instData) => {
  const data = validate(instData.data, loginJoiSchema);
  const user = await context.data.user.getItem(
    UserQueries.getByEmail(data.email)
  );

  if (!user) {
    throw new InvalidEmailOrPasswordError();
  }

  let passwordMatch = false;

  try {
    passwordMatch = await argon2.verify(user.hash, data.password);
  } catch (error) {
    console.error(error);
    throw new ServerError();
  }

  if (!passwordMatch) {
    throw new InvalidEmailOrPasswordError();
  }

  let token = await context.data.userToken.getItem(
    UserTokenQueries.getByUserIdAndAudience(user.userId, TokenAudience.Login)
  );

  if (!token) {
    token = await context.data.userToken.saveItem({
      tokenId: getNewId(),
      userId: user.userId,
      audience: [TokenAudience.Login],
      issuedAt: getDateString(),
      version: CURRENT_TOKEN_VERSION,
    });
  }

  // Make the user token available to other requests made with this request data
  instData.userToken = token;
  return {
    user: userExtractor(user),
    token: context.session.encodeToken(
      context,
      token.tokenId,
      TokenType.UserToken
    ),
  };
};

export default login;
