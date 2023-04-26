import * as argon2 from 'argon2';
import {User} from '../../../definitions/user';
import {validate} from '../../../utils/validate';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import changePassword from '../changePassword/changePassword';
import {ChangePasswordEndpointParams} from '../changePassword/types';
import {IncorrectPasswordError} from '../errors';
import {ChangePasswordWithCurrentPasswordEndpoint} from './types';
import {changePasswordWithPasswordJoiSchema} from './validation';

export async function completeChangePassword(
  context: BaseContextType,
  reqData: RequestData,
  user: User,
  password: string
) {
  reqData.user = user;
  const changePasswordReqData = RequestData.clone<ChangePasswordEndpointParams>(reqData, {
    password,
  });
  return await changePassword(context, changePasswordReqData);
}

const changePasswordWithCurrentPassword: ChangePasswordWithCurrentPasswordEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, changePasswordWithPasswordJoiSchema);
  const user = await context.session.getUser(context, instData);
  const passwordMatch = await argon2.verify(user.hash, data.currentPassword);
  if (!passwordMatch) {
    throw new IncorrectPasswordError();
  }

  const result = await completeChangePassword(context, instData, user, data.password);
  return result;
};

export default changePasswordWithCurrentPassword;
