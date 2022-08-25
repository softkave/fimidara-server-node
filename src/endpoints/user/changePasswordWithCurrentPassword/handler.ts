import * as argon2 from 'argon2';
import {validate} from '../../../utilities/validate';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import changePassword from '../changePassword/changePassword';
import {IChangePasswordParameters} from '../changePassword/types';
import {IncorrectPasswordError} from '../errors';
import {ChangePasswordWithCurrentPasswordEndpoint} from './types';
import {changePasswordWithPasswordJoiSchema} from './validation';

export async function completeChangePassword(
  context: IBaseContext,
  reqData: RequestData,
  password: string
) {
  const changePasswordReqData = RequestData.clone<IChangePasswordParameters>(
    reqData,
    {
      password,
    }
  );

  const result = await changePassword(context, changePasswordReqData);
  const updatedReqData = RequestData.merge(changePasswordReqData, reqData);
  return {result, updatedReqData};
}

const changePasswordWithCurrentPassword: ChangePasswordWithCurrentPasswordEndpoint =
  async (context, instData) => {
    const data = validate(instData.data, changePasswordWithPasswordJoiSchema);
    const currentPassword = data.currentPassword;
    let passwordMatch = false;
    const user = await context.session.getUser(context, instData);
    passwordMatch = await argon2.verify(user.hash, currentPassword);
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
