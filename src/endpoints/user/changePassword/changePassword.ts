import * as argon2 from 'argon2';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
  CURRENT_TOKEN_VERSION,
  TokenAudience,
  TokenType,
} from '../../contexts/SessionContext';
import UserQueries from '../UserQueries';
import UserTokenQueries from '../UserTokenQueries';
import {userExtractor} from '../utils';
import {ChangePasswordEndpoint} from './types';
import {changePasswordJoiSchema} from './validation';

const changePassword: ChangePasswordEndpoint = async (context, instData) => {
  const result = validate(instData.data, changePasswordJoiSchema);
  const newPassword = result.password;
  let user = await context.session.getUser(context, instData);
  const hash = await argon2.hash(newPassword);
  user = await context.data.user.assertUpdateItem(
    UserQueries.getById(user.userId),
    {
      hash,
      passwordLastChangedAt: getDateString(),
    }
  );

  // Allow other endpoints called with this request to use the updated user data
  instData.user = user;

  // Delete user token and incomingTokenData since they are no longer valid
  delete instData.userToken;
  delete instData.incomingTokenData;

  // Delete existing user tokens cause they're no longer valid
  await context.data.userToken.deleteManyItems(
    UserTokenQueries.getByUserId(user.userId)
  );

  const newToken = await context.data.userToken.saveItem({
    tokenId: getNewId(),
    audience: [TokenAudience.Login],
    issuedAt: getDateString(),
    userId: user.userId,
    version: CURRENT_TOKEN_VERSION,
  });

  // Allow other endpoints called with this request to use the updated user token
  instData.userToken = newToken;
  const encodedToken = context.session.encodeToken(
    context,
    newToken.tokenId,
    TokenType.UserToken,
    newToken.expires
  );

  return {
    token: encodedToken,
    user: userExtractor(user),
  };
};

export default changePassword;
