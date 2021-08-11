import {fireAndForgetPromise} from '../../../utilities/promiseFns';
import {JWTEndpoint} from '../../contexts/UserTokenContext';
import {CredentialsExpiredError, InvalidCredentialsError} from '../errors';
import {ChangePasswordWithTokenEndpoint} from './types';

const changePasswordWithToken: ChangePasswordWithTokenEndpoint = async (
    context,
    instData
) => {
    const tokenData = await context.session.getUserTokenData(
        context,
        instData,
        JWTEndpoint.ChangePassword
    );

    if (
        !context.userToken.containsAudience(
            context,
            tokenData,
            JWTEndpoint.ChangePassword
        )
    ) {
        throw new InvalidCredentialsError();
    }

    if (!tokenData.expires) {
        throw new InvalidCredentialsError();
    }

    if (Date.now() > tokenData.expires) {
        throw new CredentialsExpiredError();
    }

    const user = await context.user.assertGetUserById(
        context,
        tokenData.userId
    );

    instData.user = user;
    const result = await context.changePassword(context, instData);
    fireAndForgetPromise(
        context.userToken.deleteTokenById(context, tokenData.tokenId)
    );

    return result;
};

export default changePasswordWithToken;
