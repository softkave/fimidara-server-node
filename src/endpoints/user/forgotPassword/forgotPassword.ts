import {add} from 'date-fns';
import {stringify} from 'querystring';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  TokenAccessScope,
} from '../../../definitions/system';
import {IUserToken} from '../../../definitions/userToken';
import {newResource} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resourceId';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {IBaseContext} from '../../contexts/types';
import {userConstants} from '../constants';
import {assertUser} from '../utils';
import sendChangePasswordEmail from './sendChangePasswordEmail';
import {ForgotPasswordEndpoint} from './types';
import {forgotPasswordJoiSchema} from './validation';

export const forgotPassword: ForgotPasswordEndpoint = async (context, instData) => {
  const data = validate(instData.data, forgotPasswordJoiSchema);
  const user = await context.semantic.user.getByEmail(data.email);
  assertUser(user);
  const expiration = getForgotPasswordExpiration();
  const forgotToken = newResource(makeUserSessionAgent(user), AppResourceType.UserToken, {
    tokenAccessScope: [TokenAccessScope.ChangePassword],
    resourceId: getNewIdForResource(AppResourceType.UserToken),
    userId: user.resourceId,
    version: CURRENT_TOKEN_VERSION,
    expires: expiration.valueOf(),
  });
  await context.semantic.userToken.insertItem(forgotToken);
  const link = getForgotPasswordLinkFromToken(context, forgotToken);
  await sendChangePasswordEmail(context, {
    expiration,
    link,
    emailAddress: user.email,
  });
};

export function getForgotPasswordExpiration() {
  return add(new Date(), {
    days: userConstants.changePasswordTokenExpDurationInDays,
  });
}

export function getForgotPasswordLinkFromToken(context: IBaseContext, forgotToken: IUserToken) {
  const encodedToken = context.session.encodeToken(
    context,
    forgotToken.resourceId,
    AppResourceType.UserToken,
    forgotToken.expires
  );

  const link = `${context.appVariables.clientDomain}${
    context.appVariables.changePasswordPath
  }?${stringify({
    [userConstants.defaultTokenQueryParam]: encodedToken,
  })}`;

  return link;
}

export default forgotPassword;
