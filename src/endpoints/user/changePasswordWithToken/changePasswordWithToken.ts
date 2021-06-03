import AccessToken from '../../contexts/AccessToken';
import {JWTEndpoints} from '../../types';
import {CredentialsExpiredError, InvalidCredentialsError} from '../errors';
import {ChangePasswordWithTokenEndpoint} from './types';

const changePasswordWithToken: ChangePasswordWithTokenEndpoint = async (
    context,
    instData
) => {
    const tokenData = context.session.getRequestTokenData(context, instData);

    if (
        !AccessToken.containsAudience(tokenData, [
            JWTEndpoints.ChangePassword,
            JWTEndpoints.Login,
        ])
    ) {
        throw new InvalidCredentialsError();
    }

    // All change password tokens must have exp set
    if (!tokenData.exp) {
        throw new CredentialsExpiredError();
    }

    return context.changePassword(context, instData);
};

export default changePasswordWithToken;
