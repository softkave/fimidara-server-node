import {add} from 'date-fns';
import {validate} from '../../../utilities/validate';
import {JWTEndpoints} from '../../types';
import {userConstants} from '../constants';
import {UserDoesNotExistError} from '../errors';
import {ForgotPasswordEndpoint} from './types';
import {forgotPasswordJoiSchema} from './validation';
import * as querystring from 'querystring';
import AccessToken from '../../contexts/AccessToken';

const forgotPassword: ForgotPasswordEndpoint = async (context, instData) => {
    const data = validate(instData.data, forgotPasswordJoiSchema);
    const user = await context.user.getUserByEmail(context, data.email);

    if (!user) {
        throw new UserDoesNotExistError({field: 'email'});
    }

    const expiration = add(new Date(), {
        days: userConstants.changePasswordTokenExpDurationInDays,
    });

    const token = AccessToken.newUserToken({
        user,
        audience: [JWTEndpoints.ChangePassword],
        expires: expiration.valueOf(),
    });

    const link = `${context.appVariables.clientDomain}${
        context.appVariables.changePasswordPath
    }?${querystring.stringify({
        [userConstants.defaultTokenQueryParam]: token,
    })}`;

    await context.sendChangePasswordEmail(context, {
        expiration,
        link,
        emailAddress: user.email,
    });
};

export default forgotPassword;
