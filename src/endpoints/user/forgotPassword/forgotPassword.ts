import {add} from 'date-fns';
import {validate} from '../../../utilities/validate';
import {userConstants} from '../constants';
import {UserDoesNotExistError} from '../errors';
import {ForgotPasswordEndpoint} from './types';
import {forgotPasswordJoiSchema} from './validation';
import * as querystring from 'querystring';
import {
  CURRENT_USER_TOKEN_VERSION,
  JWTEndpoint,
} from '../../contexts/UserTokenContext';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';

const forgotPassword: ForgotPasswordEndpoint = async (context, instData) => {
  const data = validate(instData.data, forgotPasswordJoiSchema);
  const user = await context.user.getUserByEmail(context, data.email);

  if (!user) {
    throw new UserDoesNotExistError({field: 'email'});
  }

  const expiration = add(new Date(), {
    days: userConstants.changePasswordTokenExpDurationInDays,
  });

  const forgotToken = await context.userToken.saveToken(context, {
    audience: [JWTEndpoint.ChangePassword],
    issuedAt: getDateString(),
    tokenId: getNewId(),
    userId: user.userId,
    version: CURRENT_USER_TOKEN_VERSION,
    expires: add(new Date(), {
      days: userConstants.changePasswordTokenExpDurationInDays,
    }).valueOf(),
  });

  const encodedToken = context.userToken.encodeToken(
    context,
    forgotToken.tokenId,
    forgotToken.expires
  );

  const link = `${context.appVariables.clientDomain}${
    context.appVariables.changePasswordPath
  }?${querystring.stringify({
    [userConstants.defaultTokenQueryParam]: encodedToken,
  })}`;

  await context.sendChangePasswordEmail(context, {
    expiration,
    link,
    emailAddress: user.email,
  });
};

export default forgotPassword;
