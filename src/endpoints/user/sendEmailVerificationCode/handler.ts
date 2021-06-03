import {addMinutes, isBefore} from 'date-fns';
import {EmailAddressVerifiedError} from '../errors';
import {SendEmailVerificationCodeEndpoint} from './types';
import {getDateString} from '../../../utilities/dateFns';
import {RateLimitError} from '../../errors';
import {userConstants} from '../constants';
import {nanoid} from 'nanoid';

const sendEmailVerificationCode: SendEmailVerificationCodeEndpoint = async (
    context,
    instData
) => {
    const user = await context.session.getUser(context, instData);

    if (user.isEmailVerified) {
        throw new EmailAddressVerifiedError();
    }

    if (user.emailVerificationCodeSentAt) {
        const rateLimit = isBefore(
            new Date(),
            addMinutes(
                new Date(user.emailVerificationCodeSentAt),
                userConstants.verificationCodeRateLimitInMins
            )
        );

        if (rateLimit) {
            throw new RateLimitError();
        }
    }

    const code = nanoid(
        userConstants.emailVerificationCodeLength
    ).toUpperCase();
    await context.sendEmail(context, user.email, user.firstName, code);
    await context.user.updateUserById(context, user.userId, {
        emailVerificationCode: code,
        emailVerificationCodeSentAt: getDateString(),
    });
};

export default sendEmailVerificationCode;
