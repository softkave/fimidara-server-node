import {addMinutes, isBefore} from 'date-fns';
import {EmailAddressVerifiedError} from '../errors';
import {SendEmailVerificationCodeEndpoint} from './types';
import {getDateString} from '../../../utilities/dateFns';
import {RateLimitError} from '../../errors';
import {userConstants} from '../constants';
import * as querystring from 'querystring';
import getNewId from '../../../utilities/getNewId';
import {
    CURRENT_USER_TOKEN_VERSION,
    JWTEndpoint,
} from '../../contexts/UserTokenContext';

const sendEmailVerificationCode: SendEmailVerificationCodeEndpoint = async (
    context,
    instData
) => {
    const user = await context.session.getUser(context, instData);

    if (user.isEmailVerified) {
        throw new EmailAddressVerifiedError();
    }

    if (user.emailVerificationEmailSentAt) {
        const rateLimit = isBefore(
            new Date(),
            addMinutes(
                new Date(user.emailVerificationEmailSentAt),
                userConstants.verificationCodeRateLimitInMins
            )
        );

        if (rateLimit) {
            throw new RateLimitError();
        }
    }

    const token = await context.userToken.saveToken(context, {
        audience: [JWTEndpoint.ConfirmEmailAddress],
        issuedAt: getDateString(),
        tokenId: getNewId(),
        userId: user.userId,
        version: CURRENT_USER_TOKEN_VERSION,
    });

    const encodedToken = context.userToken.encodeToken(
        context,
        token.tokenId,
        token.expires
    );

    const link = `${context.appVariables.clientDomain}${
        context.appVariables.verifyEmailPath
    }?${querystring.stringify({
        [userConstants.defaultTokenQueryParam]: encodedToken,
    })}`;

    await context.sendEmail(context, user.email, user.firstName, link);
    await context.user.updateUserById(context, user.userId, {
        emailVerificationEmailSentAt: getDateString(),
    });
};

export default sendEmailVerificationCode;
