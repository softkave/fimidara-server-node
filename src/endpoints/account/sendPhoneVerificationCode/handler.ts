import {isBefore, addMinutes} from 'date-fns';
import {PhoneVerifiedError} from '../errors';
import {SendPhoneVerificationCodeEndpoint} from './types';
import {getDateString} from '../../../utilities/dateFns';
import {RateLimitError} from '../../errors';
import {userConstants} from '../constants';

const sendPhoneVerificationCode: SendPhoneVerificationCodeEndpoint = async (
    context,
    instData
) => {
    const user = await context.session.getUser(context, instData);

    if (user.isPhoneVerified) {
        throw new PhoneVerifiedError();
    }

    if (user.phoneVerificationCodeSentAt) {
        const rateLimit = isBefore(
            new Date(),
            addMinutes(
                new Date(user.phoneVerificationCodeSentAt),
                userConstants.verificationCodeRateLimitInMins
            )
        );

        if (rateLimit) {
            throw new RateLimitError();
        }
    }

    const sid = await context.sendCode(context, user.phone);
    await context.user.updateUserById(context, user.userId, {
        phoneVerificationCodeSentAt: getDateString(),
        phoneVerificationSID: sid,
    });
};

export default sendPhoneVerificationCode;
