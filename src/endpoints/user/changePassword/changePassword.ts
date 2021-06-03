import * as argon2 from 'argon2';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import AccessToken from '../../contexts/AccessToken';
import {JWTEndpoints} from '../../types';
import {userExtractor} from '../utils';
import {ChangePasswordEndpoint} from './types';
import {changePasswordJoiSchema} from './validation';

const changePassword: ChangePasswordEndpoint = async (context, instData) => {
    const result = validate(instData.data, changePasswordJoiSchema);
    const passwordValue = result.password;
    const user = await context.session.getUser(context, instData);
    const hash = await argon2.hash(passwordValue);

    await context.session.updateUser(context, instData, {
        hash,
        passwordLastChangedAt: getDateString(),
    });

    context.session.clearCachedUserData(context, instData);

    return {
        user: userExtractor(user),
        token: AccessToken.newUserToken({
            user,
            audience: [JWTEndpoints.Login],
        }),
    };
};

export default changePassword;
