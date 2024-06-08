import * as argon2 from 'argon2';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {INTERNAL_changePassword} from '../changePasswordWithToken/utils.js';
import {IncorrectPasswordError} from '../errors.js';
import {ChangePasswordWithCurrentPasswordEndpoint} from './types.js';
import {changePasswordWithPasswordJoiSchema} from './validation.js';

const changePasswordWithCurrentPassword: ChangePasswordWithCurrentPasswordEndpoint =
  async instData => {
    const data = validate(instData.data, changePasswordWithPasswordJoiSchema);
    const user = await kUtilsInjectables
      .session()
      .getUser(instData, kSessionUtils.accessScopes.user);
    const passwordMatch = await argon2.verify(user.hash, data.currentPassword);

    if (!passwordMatch) {
      throw new IncorrectPasswordError();
    }

    const result = await INTERNAL_changePassword(
      instData,
      user.resourceId,
      data
    );
    return result;
  };

export default changePasswordWithCurrentPassword;
