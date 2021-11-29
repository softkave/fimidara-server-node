import {ChangePasswordWithCurrentPasswordEndpoint} from './types';
import {changePasswordWithPasswordJoiSchema} from './validation';
import * as argon2 from 'argon2';
import {ServerError} from '../../../utilities/errors';
import {validate} from '../../../utilities/validate';
import {IncorrectPasswordError} from '../errors';
import {IChangePasswordParameters} from '../changePassword/types';
import changePassword from '../changePassword/changePassword';
import RequestData from '../../RequestData';
import {IBaseContext} from '../../contexts/BaseContext';

export async function completeChangePassword(
  context: IBaseContext,
  reqData: RequestData,
  password: string
) {
  const changePasswordReqData = RequestData.clone(reqData);
  const changePasswordParams: IChangePasswordParameters = {
    password,
  };

  changePasswordReqData.data = changePasswordParams;
  const result = await changePassword(context, changePasswordReqData);
  const updatedReqData = RequestData.merge(reqData, changePasswordReqData);
  return {result, updatedReqData};
}

const changePasswordWithCurrentPassword: ChangePasswordWithCurrentPasswordEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, changePasswordWithPasswordJoiSchema);
  const currentPassword = data.currentPassword;
  let passwordMatch = false;
  const user = await context.session.getUser(context, instData);

  try {
    passwordMatch = await argon2.verify(user.hash, currentPassword);
  } catch (error) {
    console.error(error);
    throw new ServerError();
  }

  if (!passwordMatch) {
    throw new IncorrectPasswordError();
  }

  const {result} = await completeChangePassword(
    context,
    instData,
    data.password
  );

  return result;
};

export default changePasswordWithCurrentPassword;
