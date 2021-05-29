import {isAfter, addMinutes} from 'date-fns';
import {
    UserDoesNotExistError,
    PhoneVerifiedError,
    VerificationCodeExpiredError,
    VerificationCodeInvalidError,
} from '../errors';
import {ConfirmPhoneNumberEndpoint} from './types';
import {getDateString} from '../../../utilities/dateFns';
import AccessToken from '../../AccessToken';
import {JWTEndpoints} from '../../types';
import {userExtractor} from '../utils';
import {InvalidRequestError} from '../../errors';
import {userConstants} from '../constants';
import {validate} from '../../../utilities/validate';
import {confirmPhoneNumberJoiSchema} from './validation';

const confirmPhoneNumber: ConfirmPhoneNumberEndpoint = async (
    context,
    instData
) => {
    const user = await context.session.getUser(context, instData);
    const data = validate(instData.data, confirmPhoneNumberJoiSchema);

    if (user.isPhoneVerified) {
        throw new PhoneVerifiedError();
    }

    if (!user.phoneVerificationSID || !user.phoneVerificationCodeSentAt) {
        // TODO: is this the right error?
        throw new InvalidRequestError();
    }

    const isCodeExpired = isAfter(
        new Date(),
        addMinutes(
            new Date(user.phoneVerificationCodeSentAt),
            userConstants.phoneVerificationCodeExpirationDurationInMins
        )
    );

    if (isCodeExpired) {
        throw new VerificationCodeExpiredError();
    }

    await context.verifyCode(context, user.phone, data.code);

    const updatedUser = await context.user.updateUserById(
        context,
        user.userId,
        {
            isPhoneVerified: true,
            phoneVerifiedAt: getDateString(),
            phoneVerificationCodeSentAt: null,
            phoneVerificationSID: null,
        }
    );

    if (!updatedUser) {
        throw new UserDoesNotExistError();
    }

    return {
        user: userExtractor(updatedUser),
        token: AccessToken.newUserToken({
            user: updatedUser,
            audience: [JWTEndpoints.Login],
        }),
    };
};

export default confirmPhoneNumber;
