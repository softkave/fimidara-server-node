import {UserDoesNotExistError, EmailAddressVerifiedError} from '../errors';
import {ConfirmEmailAddressEndpoint} from './types';
import {getDateString} from '../../../utilities/dateFns';
import {userExtractor} from '../utils';
import {JWTEndpoint} from '../../contexts/UserTokenContext';
import {fireAndForgetPromise} from '../../../utilities/promiseFns';

const confirmEmailAddress: ConfirmEmailAddressEndpoint = async (
    context,
    instData
) => {
    const user = await context.session.getUser(context, instData, [
        JWTEndpoint.ConfirmEmailAddress,
    ]);

    if (user.isEmailVerified) {
        throw new EmailAddressVerifiedError();
    }

    const updatedUser = await context.user.updateUserById(
        context,
        user.userId,
        {
            isEmailVerified: true,
            emailVerifiedAt: getDateString(),
            emailVerificationEmailSentAt: null,
        }
    );

    if (!updatedUser) {
        throw new UserDoesNotExistError();
    }

    const verifyToken = await context.session.getUserTokenData(
        context,
        instData,
        [JWTEndpoint.ConfirmEmailAddress]
    );

    fireAndForgetPromise(
        context.userToken.deleteTokenById(context, verifyToken.tokenId)
    );

    const userToken = await context.userToken.assertGetTokenByUserId(
        context,
        user.userId
    );

    const encodedToken = context.userToken.encodeToken(
        context,
        userToken.tokenId,
        userToken.expires
    );

    return {
        user: userExtractor(updatedUser),
        token: encodedToken,
    };
};

export default confirmEmailAddress;
