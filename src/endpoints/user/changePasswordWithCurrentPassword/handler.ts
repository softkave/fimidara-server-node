import {ChangePasswordWithCurrentPasswordEndpoint} from './types';
import {changePasswordWithPasswordJoiSchema} from './validation';
import * as argon2 from 'argon2';
import {ServerError} from '../../../utilities/errors';
import RequestData from '../../RequestData';
import {validate} from '../../../utilities/validate';
import {IncorrectPasswordError} from '../errors';

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

    const result = await context.changePassword(
        context,
        instData,
        data.password
    );

    return result;
};

export default changePasswordWithCurrentPassword;
