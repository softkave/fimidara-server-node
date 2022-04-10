import {add} from 'date-fns';
import {stringify} from 'querystring';
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
import {IBaseContext} from '../../contexts/BaseContext';
import {IUserToken} from '../../../definitions/userToken';

const forgotPassword: ForgotPasswordEndpoint = async (context, instData) => {
  const data = validate(instData.data, forgotPasswordJoiSchema);
  const user = await context.data.user.assertGetItem(
    UserQueries.getByEmail(data.email)
  );

  const expiration = getForgotPasswordExpiration();
  const forgotToken = await context.data.userToken.saveItem({
    audience: [TokenAudience.ChangePassword],
    issuedAt: getDateString(),
    resourceId: getNewId(),
    userId: user.resourceId,
    version: CURRENT_TOKEN_VERSION,
    expires: expiration.valueOf(),
  });

  const link = getForgotPasswordLinkFromToken(context, forgotToken);
  await sendChangePasswordEmail(context, {
    expiration,
    link,
    emailAddress: user.email,
  });
};

export default forgotPassword;

export function getForgotPasswordExpiration() {
  return add(new Date(), {
    days: userConstants.changePasswordTokenExpDurationInDays,
  });
}

export function getForgotPasswordLinkFromToken(
  context: IBaseContext,
  forgotToken: IUserToken
) {
  const encodedToken = context.session.encodeToken(
    context,
    forgotToken.resourceId,
    TokenType.UserToken,
    forgotToken.expires
  );

  const link = `${context.appVariables.clientDomain}${
    context.appVariables.changePasswordPath
  }?${stringify({
    [userConstants.defaultTokenQueryParam]: encodedToken,
  })}`;

  return link;
}
