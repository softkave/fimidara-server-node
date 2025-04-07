import * as argon2 from 'argon2';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {INTERNAL_changePassword} from '../changePasswordWithToken/utils.js';
import {IncorrectPasswordError} from '../errors.js';
import {ChangePasswordWithCurrentPasswordEndpoint} from './types.js';
import {changePasswordWithPasswordJoiSchema} from './validation.js';

const changePasswordWithCurrentPassword: ChangePasswordWithCurrentPasswordEndpoint =
  async reqData => {
    const data = validate(reqData.data, changePasswordWithPasswordJoiSchema);
    const user = await kIjxUtils
      .session()
      .getUser(reqData, kSessionUtils.accessScopes.user);
    const passwordMatch = await argon2.verify(user.hash, data.currentPassword);

    if (!passwordMatch) {
      throw new IncorrectPasswordError();
    }

    const result = await INTERNAL_changePassword(
      reqData,
      user.resourceId,
      data
    );

    return result;
  };

export default changePasswordWithCurrentPassword;
