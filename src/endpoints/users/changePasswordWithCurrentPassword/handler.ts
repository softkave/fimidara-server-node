import * as argon2 from 'argon2';
import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {INTERNAL_changePassword} from '../changePasswordWithToken/utils';
import {IncorrectPasswordError} from '../errors';
import {ChangePasswordWithCurrentPasswordEndpoint} from './types';
import {changePasswordWithPasswordJoiSchema} from './validation';

const changePasswordWithCurrentPassword: ChangePasswordWithCurrentPasswordEndpoint =
  async instData => {
    const data = validate(instData.data, changePasswordWithPasswordJoiSchema);
    const user = await kUtilsInjectables.session().getUser(instData);
    const passwordMatch = await argon2.verify(user.hash, data.currentPassword);

    if (!passwordMatch) {
      throw new IncorrectPasswordError();
    }

    const result = await INTERNAL_changePassword(instData, user.resourceId, data);
    return result;
  };

export default changePasswordWithCurrentPassword;
