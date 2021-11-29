import {add} from 'date-fns';
import * as querystring from 'querystring';
import {validate} from '../../../utilities/validate';
import {userConstants} from '../constants';
import {ForgotPasswordEndpoint} from './types';
import {forgotPasswordJoiSchema} from './validation';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import UserQueries from '../UserQueries';
import {
  CURRENT_TOKEN_VERSION,
  TokenAudience,
  TokenType,
} from '../../contexts/SessionContext';
import sendChangePasswordEmail from './sendChangePasswordEmail';

const forgotPassword: ForgotPasswordEndpoint = async (context, instData) => {
  const data = validate(instData.data, forgotPasswordJoiSchema);
  const user = await context.data.user.assertGetItem(
    UserQueries.getByEmail(data.email)
  );

  const expiration = add(new Date(), {
    days: userConstants.changePasswordTokenExpDurationInDays,
  });

  const forgotToken = await context.data.userToken.saveItem({
    audience: [TokenAudience.ChangePassword],
    issuedAt: getDateString(),
    tokenId: getNewId(),
    userId: user.userId,
    version: CURRENT_TOKEN_VERSION,
    expires: add(new Date(), {
      days: userConstants.changePasswordTokenExpDurationInDays,
    }).valueOf(),
  });

  const encodedToken = context.session.encodeToken(
    context,
    forgotToken.tokenId,
    TokenType.UserToken,
    forgotToken.expires
  );

  const link = `${context.appVariables.clientDomain}${
    context.appVariables.changePasswordPath
  }?${querystring.stringify({
    [userConstants.defaultTokenQueryParam]: encodedToken,
  })}`;

  await sendChangePasswordEmail(context, {
    expiration,
    link,
    emailAddress: user.email,
  });
};

export default forgotPassword;
