import {add} from 'date-fns';
import {stringify} from 'querystring';
import {AppResourceType, CURRENT_TOKEN_VERSION, TokenAudience, TokenType} from '../../../definitions/system';
import {IUserToken} from '../../../definitions/userToken';
import {getDateString} from '../../../utils/dateFns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {validate} from '../../../utils/validate';
import {} from '../../contexts/SessionContext';
import {IBaseContext} from '../../contexts/types';
import {userConstants} from '../constants';
import UserQueries from '../UserQueries';
import sendChangePasswordEmail from './sendChangePasswordEmail';
import {ForgotPasswordEndpoint} from './types';
import {forgotPasswordJoiSchema} from './validation';

const forgotPassword: ForgotPasswordEndpoint = async (context, instData) => {
  const data = validate(instData.data, forgotPasswordJoiSchema);
  const user = await context.data.user.assertGetOneByQuery(UserQueries.getByEmail(data.email));

  const expiration = getForgotPasswordExpiration();
  const forgotToken = await context.data.userToken.insertItem({
    audience: [TokenAudience.ChangePassword],
    issuedAt: getDateString(),
    resourceId: getNewIdForResource(AppResourceType.UserToken),
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

export function getForgotPasswordLinkFromToken(context: IBaseContext, forgotToken: IUserToken) {
  const encodedToken = context.session.encodeToken(
    context,
    forgotToken.resourceId,
    TokenType.UserToken,
    forgotToken.expires
  );

  const link = `${context.appVariables.clientDomain}${context.appVariables.changePasswordPath}?${stringify({
    [userConstants.defaultTokenQueryParam]: encodedToken,
  })}`;

  return link;
}
